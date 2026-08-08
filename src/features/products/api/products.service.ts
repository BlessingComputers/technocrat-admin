import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { chunkBySize } from "../utils/image-chunks";
import type {
  BrandInput,
  BulkBatchStatus,
  BulkDeleteProductsResult,
  BulkEditProductsInput,
  BulkEditProductsResult,
  BulkUploadResult,
  CategoryInput,
  CreateProductDto,
  CreateProductResult,
  CreateVariantDto,
  NewProductImage,
  ProductBrand,
  ProductCategory,
  ProductDetail,
  ProductImage,
  ProductImageMeta,
  ProductListEnvelope,
  ProductStats,
  ProductSubcategory,
  ProductsListParams,
  UpdateProductDto,
  UpdateVariantDto,
  UploadedImageMeta,
} from "../types/products";

/**
 * Products data access (products + brands + categories — ADR-0002).
 *
 * The client unwraps the response envelope (ADR-0007), so `api.*` returns the
 * inner payload directly — except `getProducts`, which uses `{ raw: true }` to
 * keep the sibling pagination `meta` + `facets`.
 *
 * TODO(codegen, ADR-0006): several URLs below are ported verbatim from the main
 * app and carry its quirks (create POSTs to `/all`). Both status and full
 * updates PATCH `/:id`. Pin these to the OpenAPI spec when it lands.
 */

const { products, admin } = API_ENDPOINTS;

type QueryParams = Record<string, string | number | boolean | undefined>;

/** Map the list view's internal filter state to backend query params. */
function buildListParams(params?: ProductsListParams): QueryParams {
  const q: QueryParams = {
    page: params?.page || 1,
    limit: params?.limit || 20,
    q: params?.search || undefined,
    categorySlug: params?.category === "all" ? undefined : params?.category,
    brandSlug: params?.brand === "all" ? undefined : params?.brand,
    condition: params?.condition,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    // sourcingType / isActive are derived from `tab` in the block below — do NOT
    // pass the raw tab value here. The "inactive" tab is an isActive=false
    // filter, not a SourcingType; leaking it as sourcingType=inactive 422s
    // against the backend enum (INHOUSE | OUTSOURCED).
    stock: params?.stock,
    isFeatured:
      params?.isFeatured !== undefined ? String(params.isFeatured) : undefined,
    isActive:
      params?.isActive !== undefined ? String(params.isActive) : undefined,
  };

  // Sort: API sortBy = newest | oldest | price_asc | price_desc | name_asc |
  // name_desc | popularity.
  if (params?.sortKey && params?.sortDir) {
    const { sortKey, sortDir } = params;
    if (sortKey === "name") {
      q.sortBy = sortDir === "asc" ? "name_asc" : "name_desc";
    } else if (sortKey === "price") {
      q.sortBy = sortDir === "asc" ? "price_asc" : "price_desc";
    } else if (sortKey === "createdAt" || sortKey === "newest") {
      q.sortBy = sortDir === "asc" ? "oldest" : "newest";
    } else if (sortKey === "qty" || sortKey === "popularity") {
      q.sortBy = "popularity";
    }
  } else {
    q.sortBy = "newest";
  }

  // Stock status → availability filter.
  if (params?.stock === "low") q.availabilityStatus = "LOW_STOCK";
  else if (params?.stock === "out") q.availabilityStatus = "OUT_OF_STOCK";
  else if (params?.stock === "ok") q.availabilityStatus = "IN_STOCK";

  // Tabs → sourcing / active.
  if (params?.tab === "inhouse") q.sourcingType = "INHOUSE";
  else if (params?.tab === "outsourced") q.sourcingType = "OUTSOURCED";
  else if (params?.tab === "inactive") q.isActive = "false";

  return q;
}

/** Shape of the admin dashboard KPI payload we read product counts from. */
interface DashboardProductKpis {
  totalProducts?: number;
  activeProducts?: number;
  lowStockVariants?: number;
  outOfStockVariants?: number;
}

/**
 * Build the multipart body for `POST /products`.
 *
 * The OpenAPI spec renders this endpoint as taking a single `data` object — that
 * is an artifact of how the backend authors its swagger (it nests the zod schema
 * under `data` purely to name the component). The controller reads FLAT fields
 * off `req.body` and `JSON.parse`s exactly two of them, `variants` and
 * `specifications`. Everything else must be a plain string, which is why the
 * boolean status fields are absent — see `createProduct`.
 *
 * @param files      the subset of images travelling in this request
 * @param allImages  the full queue, used to derive each file's true sortOrder
 */
function buildCreateProductForm(
  data: CreateProductDto,
  files: NewProductImage[],
  allImages: NewProductImage[],
): FormData {
  const form = new FormData();

  form.append("name", data.name);
  form.append("categoryId", data.categoryId);
  form.append("brandId", data.brandId);
  if (data.slug) form.append("slug", data.slug);
  if (data.description) form.append("description", data.description);
  form.append("variants", JSON.stringify(data.variants));
  form.append("specifications", JSON.stringify(data.specifications ?? []));

  files.forEach((img, i) => {
    form.append("images", img.file);
    // Index against the full queue so images split across requests keep the
    // order the staffer arranged them in.
    form.append(`imageSortOrder_${i}`, String(allImages.indexOf(img)));
    // Only ever sent for the chosen image: the controller reads this as
    // `=== 'true'`, so an explicit "false" and an omitted field are the same.
    if (img.isPrimary) form.append(`imagePrimary_${i}`, "true");
  });

  return form;
}

export const productsService = {
  // ── Products ───────────────────────────────────────────────────────
  getProducts: (params?: ProductsListParams) =>
    api.get<ProductListEnvelope>(products.list, {
      params: buildListParams(params),
      raw: true,
    }),

  getProduct: (productId: string) =>
    api.get<ProductDetail>(`${products.base}/${productId}`),

  /**
   * Create a product, optionally with its first images in the SAME request.
   *
   * `POST /products` accepts multipart/form-data and takes files on the `images`
   * field, so a product no longer has to exist before its gallery can be
   * uploaded. Two constraints shape what actually goes over the wire:
   *
   *  1. Vercel caps a request body at ~4.5 MB, so only a size-budgeted first
   *     batch rides along with the create (`chunkBySize`); anything left over is
   *     pushed through `POST /:id/images` afterwards, one request each. The
   *     caller still sees a single operation.
   *  2. The backend validates the multipart fields with a plain
   *     `z.boolean()`/`z.number()` schema and no coercion, so `isActive` /
   *     `isFeatured` — which arrive as the strings "true"/"false" — would 400.
   *     They're omitted here (the backend defaults to active + not-featured) and
   *     sent as a JSON PATCH afterwards only when they differ from that default.
   *
   * With no images this stays a plain JSON POST, exactly as before.
   */
  createProduct: async (
    data: CreateProductDto,
    images: NewProductImage[] = [],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<CreateProductResult> => {
    if (images.length === 0) {
      // `products.base`, not `products.list` — the backend registers create on
      // `POST /v1/products`; `/v1/products/all` is GET-only (it was carried over
      // from the main app, per the TODO above). JSON is accepted here: the
      // multer middleware passes non-multipart bodies straight through, so the
      // status booleans keep their type.
      return api.post<CreateProductResult>(products.base, data);
    }

    const [inlineBatch = [], ...rest] = chunkBySize(
      images,
      (img) => img.file.size,
    );
    const remainder = rest.flat();

    onProgress?.(0, images.length);
    const created = await api.post<CreateProductResult>(
      // Same-origin Node handler, NOT the `/api/*` edge rewrite — see
      // app/api/admin/products/create/route.ts.
      "/api/admin/products/create",
      buildCreateProductForm(data, inlineBatch, images),
      { timeout: 120_000 },
    );
    onProgress?.(inlineBatch.length, images.length);

    if (remainder.length > 0) {
      await productsService.uploadProductImages(
        created.id,
        remainder.map((img) => img.file),
        (completed) => onProgress?.(inlineBatch.length + completed, images.length),
        remainder.map((img) => ({
          isPrimary: img.isPrimary,
          sortOrder: images.indexOf(img),
        })),
      );
    }

    // Status can't ride in the multipart body (see above). Only costs a request
    // when the staffer actually changed it away from the default.
    if (data.isActive === false || data.isFeatured === true) {
      await api.patch<ProductDetail>(`${products.base}/${created.id}`, {
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      });
    }

    return created;
  },

  updateProduct: async (
    productId: string,
    data: UpdateProductDto,
  ): Promise<ProductDetail> => {
    // The product PATCH endpoint ignores `variants` — they live behind their own
    // endpoints. Split them off, update the product, then PATCH each variant we
    // can address by id.
    //
    // We deliberately DO NOT create a variant here for an id-less entry. The
    // product detail endpoint hides INACTIVE variants, so a product whose only
    // variant is inactive (e.g. legacy bulk imports — the importer used to send
    // variants as inactive) loads with `variants: []` and looks like it has
    // none. POSTing a new one would create a DUPLICATE alongside the hidden,
    // inactive original. Such products are repaired by ACTIVATING the existing
    // variant (DB backfill, and the admin detail endpoint returning inactive
    // variants), never by creating a new one. New uploads now send the variant
    // active, so this id-less case only arises for un-backfilled legacy rows.
    const { variants, ...productData } = data;

    const updated = await api.patch<ProductDetail>(
      `${products.base}/${productId}`,
      productData,
    );

    const editableVariants = variants?.filter((v) => v.id) ?? [];
    if (editableVariants.length) {
      await Promise.all(
        editableVariants.map(({ id, ...variantData }) =>
          productsService.updateVariant(productId, id!, variantData),
        ),
      );
    }

    return updated;
  },

  updateVariant: (
    productId: string,
    variantId: string,
    data: UpdateVariantDto,
  ) =>
    api.patch<{ message: string }>(
      products.variant(productId, variantId),
      data,
    ),

  createVariant: (productId: string, data: CreateVariantDto) =>
    api.post<{ id: string; variantId: string }>(
      products.addVariant(productId),
      data,
    ),

  updateProductStatus: (id: string, isActive: boolean) =>
    api.patch<ProductDetail>(`${products.base}/${id}`, { isActive }),

  /** Soft-delete (deactivate) — hides the product but keeps it in the DB. */
  deleteProduct: (id: string) => api.delete<void>(`${products.base}/${id}`),

  /**
   * Hard-delete — permanently removes the product and cascades its variants,
   * images, specs, cart/wishlist items, reviews, and part links. Cannot be
   * undone. The backend returns 409 when the product has order history or
   * reserved stock (a purchase in progress) — the caller surfaces that message.
   */
  permanentlyDeleteProduct: (id: string) =>
    api.delete<{ message?: string }>(`${products.base}/${id}/permanent`),

  // ── Bulk ───────────────────────────────────────────────────────────
  bulkCreateProducts: (data: {
    idempotencyKey: string;
    /** Key→metadata map from `bulkUploadImages` (Step 1); `{}` when no images. */
    uploadedImages: Record<string, UploadedImageMeta>;
    products: CreateProductDto[];
  }) => api.post<BulkUploadResult>(products.bulk, data),

  getBulkBatchStatus: (batchId: string) =>
    api.get<BulkBatchStatus>(`${products.bulk}/${batchId}`),

  /**
   * Multi-select edit across existing products (synchronous `updateMany`). Only
   * categorical/shared fields — `productIds` are DB UUIDs. `sourcingType`
   * cascades to every variant of each selected product.
   */
  bulkEditProducts: (data: BulkEditProductsInput) =>
    api.post<BulkEditProductsResult>(products.bulkEdit, data),

  /** Multi-select soft-delete (deactivate) — mirrors DELETE /:id, not /permanent. */
  bulkDeleteProducts: (productIds: string[]) =>
    api.post<BulkDeleteProductsResult>(products.bulkDelete, { productIds }),

  // ── Search / cache maintenance (require search:admin) ───────────────
  /** Force an OpenSearch re-index of a single product (async, 202). */
  reindexProduct: (productId: string) =>
    api.post<{ message: string }>(products.adminReindex(productId)),

  /** Re-index the entire catalog in OpenSearch (async, 202). */
  syncCatalog: () => api.post<{ message: string }>(products.adminSync),

  /** Bust all product Redis cache keys (200). */
  clearProductCache: () =>
    api.post<{ message: string }>(products.adminCacheClear),

  bulkUploadImages: async (
    files: { file: File; key: string }[],
  ): Promise<Record<string, UploadedImageMeta>> => {
    const formData = new FormData();
    const keys: string[] = [];
    for (const { file, key } of files) {
      formData.append("images", file);
      keys.push(key);
    }
    formData.append("keys", JSON.stringify(keys));
    // Route through the same-origin Node handler (see
    // app/api/admin/products/images/bulk-upload/route.ts), NOT the `/api/*` edge
    // rewrite — the rewrite's ~30s proxy window makes the backend's upload+store
    // round-trip 504 on Vercel even for small files.
    const result = await api.post<{
      images: Record<string, UploadedImageMeta>;
    }>(`/api/admin/products/images/bulk-upload`, formData, {
      timeout: 120_000,
    });
    return result.images;
  },

  // ── Images ─────────────────────────────────────────────────────────
  /**
   * @param meta Optional per-file metadata, index-aligned with `files`. Because
   * each file gets its own request, the backend would otherwise default every
   * image to `sortOrder: 0` and `isPrimary: false` — pass this to place them.
   */
  uploadProductImages: async (
    productId: string,
    files: File[],
    onProgress?: (completed: number, total: number) => void,
    meta?: ProductImageMeta[],
  ): Promise<ProductImage[]> => {
    // ONE image per request. The backend's per-image receive→process→store
    // time stacks up when several share a request, blowing the Vercel function's
    // duration limit → 504 (observed with 6 gallery images in one request). A
    // file-per-request keeps each call short and gives each its own fresh
    // function budget; they run sequentially below, reporting progress after
    // each. (Still size-capped as a backstop.) Originals upload untouched.
    const batches = chunkBySize(files, (f) => f.size, undefined, 1);
    const uploaded: ProductImage[] = [];
    let completed = 0;
    onProgress?.(0, files.length);
    for (const batch of batches) {
      const formData = new FormData();
      batch.forEach((file, i) => {
        formData.append("images", file);
        const fileMeta = meta?.[completed + i];
        if (!fileMeta) return;
        if (fileMeta.altText) formData.append(`imageAlt_${i}`, fileMeta.altText);
        if (fileMeta.isPrimary) formData.append(`imagePrimary_${i}`, "true");
        if (fileMeta.sortOrder !== undefined) {
          formData.append(`imageSortOrder_${i}`, String(fileMeta.sortOrder));
        }
      });
      // Route through the same-origin Node handler (see
      // app/api/admin/products/images/upload/route.ts), NOT the `/api/*` edge
      // rewrite — the rewrite's ~30s proxy window makes the backend's
      // upload+store round-trip 504 on Vercel even for tiny files. The handler
      // is a STATIC route taking productId as a query param (a dynamic `[id]`
      // route would be swallowed by the catch-all rewrite — afterFiles ordering).
      const result = await api.post<
        { images?: ProductImage[] } | ProductImage[]
      >(
        `/api/admin/products/images/upload?productId=${encodeURIComponent(productId)}`,
        formData,
        { timeout: 120_000 },
      );
      uploaded.push(
        ...(Array.isArray(result) ? result : (result.images ?? [])),
      );
      completed += batch.length;
      onProgress?.(completed, files.length);
    }
    return uploaded;
  },

  deleteProductImage: (productId: string, imageId: string) =>
    api.delete<void>(`${products.base}/${productId}/images/${imageId}`),

  setProductPrimaryImage: (productId: string, imageId: string) =>
    api.patch<{ message: string }>(
      `${products.base}/${productId}/images/${imageId}/primary`,
    ),

  reorderProductImages: (
    productId: string,
    order: { imageId: string; sortOrder: number }[],
  ) =>
    api.patch<{ message: string }>(
      `${products.base}/${productId}/images/reorder`,
      { order },
    ),

  // ── Categories ─────────────────────────────────────────────────────
  getCategories: () => api.get<ProductCategory[]>(products.categories),

  createCategory: (data: CategoryInput) =>
    api.post<ProductCategory>(products.categories, data),

  updateCategory: (categoryId: string, data: Partial<CategoryInput>) =>
    api.patch<ProductCategory>(`${products.categories}/${categoryId}`, data),

  deleteCategory: (categoryId: string) =>
    api.delete<void>(`${products.categories}/${categoryId}`),

  moveCategory: (categoryId: string, newParentId: string) =>
    api.patch<void>(`${products.categories}/${categoryId}/move/${newParentId}`),

  // ── Subcategories ──────────────────────────────────────────────────
  getSubcategories: (
    categoryId: string,
    params?: { includeInactive?: boolean; depth?: 1 | 2 | 3 },
  ) =>
    api.get<ProductSubcategory[]>(
      `${products.categories}/${categoryId}/subcategories`,
      {
        params: {
          includeInactive: params?.includeInactive ? "true" : undefined,
          depth: params?.depth,
        },
      },
    ),

  createSubcategory: (categoryId: string, data: CategoryInput) =>
    api.post<ProductSubcategory>(
      `${products.categories}/${categoryId}/subcategories`,
      data,
    ),

  updateSubcategory: (
    categoryId: string,
    subId: string,
    data: Partial<CategoryInput>,
  ) =>
    api.patch<ProductSubcategory>(
      `${products.categories}/${categoryId}/subcategories/${subId}`,
      data,
    ),

  deleteSubcategory: (categoryId: string, subId: string) =>
    api.delete<void>(
      `${products.categories}/${categoryId}/subcategories/${subId}`,
    ),

  reorderSubcategories: (
    categoryId: string,
    order: { subId: string; sortOrder: number }[],
  ) =>
    api.patch<void>(
      `${products.categories}/${categoryId}/subcategories/reorder`,
      { order },
    ),

  // ── Brands ─────────────────────────────────────────────────────────
  getBrands: (params?: QueryParams) =>
    api.get<ProductBrand[]>(products.brands, { params }),

  createBrand: (data: BrandInput) =>
    api.post<ProductBrand>(products.brands, data),

  updateBrand: (brandId: string, data: Partial<BrandInput>) =>
    api.patch<ProductBrand>(`${products.brands}/${brandId}`, data),

  deleteBrand: (brandId: string) =>
    api.delete<void>(`${products.brands}/${brandId}`),

  // ── Stats (derived from the admin dashboard KPIs) ──────────────────
  getProductsStats: async (): Promise<ProductStats> => {
    const kpi = await api.get<DashboardProductKpis>(admin.dashboard);
    const lowStock = kpi?.lowStockVariants || 0;
    const outOfStock = kpi?.outOfStockVariants || 0;
    return {
      total: kpi?.totalProducts || 0,
      active: kpi?.activeProducts || 0,
      lowStock,
      outOfStock,
      needsRestock: lowStock + outOfStock,
    };
  },
};
