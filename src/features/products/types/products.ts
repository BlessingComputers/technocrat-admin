// Types for the products feature (ADR-0002): products + brands + categories.
// Promote a type to src/types/ only when a SECOND feature needs it.
//
// TODO(codegen, ADR-0006): once the OpenAPI types land, alias the response
// shapes here to the generated schemas (Zod owns request/form inputs).

// ── Taxonomy ──────────────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  categoryId?: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  count?: number;
  productCount?: number;
  isActive: boolean;
  sortOrder?: number;
  parentId?: string;
  children?: ProductCategory[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSubcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  primaryImage?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder?: number;
  parentId?: string;
  productCount?: number;
  children?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  productCount?: number;
  count?: number; // legacy backward compatibility
  isActive: boolean;
  websiteUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Product building blocks ───────────────────────────────────────────

export interface ProductVariant {
  id?: string; // present on update payloads to match an existing variant
  name: string;
  sku?: string;
  condition?: "NEW" | "REFURBISHED" | "USED" | "OPEN_BOX";
  sourcingType?: "INHOUSE" | "OUTSOURCED";
  price: number;
  costPrice: number;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number;
  weight?: number;
  imageUrl?: string;
  isActive?: boolean;
  attributes?: Array<{ name: string; value: string }>;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
  storagePublicId: string;
  storageProvider: string;
}

export interface ProductSpecification {
  name: string;
  value: string;
  sortOrder: number;
}

export interface CartStatus {
  inCart: boolean;
  quantity: number;
  variantId: string | null;
}

// ── Product (detail + summary) ────────────────────────────────────────

export interface ProductDetailVariant {
  id: string;
  variantId: string;
  productId: string;
  name: string;
  sku: string;
  condition: string;
  sourcingType: string;
  price: number;
  compareAtPrice: number;
  costPrice: number;
  availabilityStatus: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  weight: number;
  imageUrl: string;
  isActive: boolean;
  attributes: Array<{ name: string; value: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail {
  id: string;
  productId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  subcategoryId?: string | null;
  brandId: string;
  primaryImage?: string;
  averageRating: number;
  reviewCount: number;
  totalSales: number;
  isActive: boolean;
  isFeatured: boolean;
  publishedAt: string;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logoUrl: string };
  variants: ProductDetailVariant[];
  images: ProductImage[];
  specifications: ProductSpecification[];
  lowestPrice?: number;
  highestPrice?: number;
  availabilityStatus?: string;
  cartStatus?: CartStatus;
  /** The staff member who uploaded the product. Surfaced to super admins only. */
  createdBy?: { staffId: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  productId: string;
  name: string;
  slug: string;
  averageRating: number;
  reviewCount: number;
  totalSales: number;
  isActive: boolean;
  isFeatured: boolean;
  description?: string;
  category: { name: string; slug: string };
  brand: { name: string; slug: string; logoUrl: string | null };
  primaryImage: string | null;
  lowestPrice: number;
  highestPrice: number;
  availabilityStatus: string;
  /**
   * Product-level sourcing, when the list endpoint surfaces it. Sourcing lives
   * per-variant (ProductDetailVariant.sourcingType); for a list row the backend
   * may collapse it to a single value, "MIXED", or omit it — rendered
   * gracefully ("—") when absent.
   */
  sourcingType?: "INHOUSE" | "OUTSOURCED" | "MIXED" | (string & {});
  cartStatus?: CartStatus;
  createdAt: string;
}

export type Product = ProductDetail;

// ── List / stats ──────────────────────────────────────────────────────

/** Internal filter state for the list view (mapped to backend query params). */
export interface ProductsListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string; // slug
  brand?: string; // slug
  stock?: "ok" | "low" | "out";
  tab?: "all" | "inhouse" | "outsourced" | "inactive";
  sortKey?: string;
  sortDir?: "asc" | "desc";
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFacets {
  categories: Array<{ key: string; docCount: number }>;
  brands: Array<{ key: string; docCount: number }>;
  availability: Array<{ key: string; docCount: number }>;
  conditions: Array<{ key: string; docCount: number }>;
  priceRanges: Array<{ key: string; docCount: number }>;
}

/**
 * Full list envelope kept via `{ raw: true }` (ADR-0007): pagination `meta` and
 * `facets` are siblings of `data`, so the default unwrap would drop them.
 */
export interface ProductListEnvelope {
  success?: boolean;
  data: ProductSummary[];
  meta: PaginationMeta;
  facets?: ProductFacets;
  didYouMean?: string | null;
}

export interface ProductStats {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  needsRestock: number;
}

// ── Bulk edit / delete ─────────────────────────────────────────────────
// Multi-select edit / soft-delete across existing products. `productIds` are DB
// UUIDs (ProductSummary.id), NOT the human productId. Only categorical/shared
// fields are editable — name/slug/price are per-item-unique (backend rejects
// them). At least one editable field must be present. `sourcingType` cascades
// to EVERY variant of each selected product.

export interface BulkEditProductsInput {
  productIds: string[];
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sourcingType?: "INHOUSE" | "OUTSOURCED";
}

/** `POST /products/bulk-edit` result — how many rows matched/updated. */
export interface BulkEditProductsResult {
  updated: number;
}

/** `POST /products/bulk-delete` result — soft-deactivated count. */
export interface BulkDeleteProductsResult {
  deactivated: number;
}

// ── Mutations / DTOs ──────────────────────────────────────────────────

export interface CreateProductDto {
  name: string;
  slug?: string;
  categoryId: string;
  /** Optional — must belong to categoryId. Omitted when none chosen. */
  subcategoryId?: string | null;
  brandId: string;
  sourcingType?: "INHOUSE" | "OUTSOURCED";
  isActive?: boolean;
  isFeatured?: boolean;
  description?: string;
  variants: ProductVariant[];
  specifications?: Array<{ name: string; value: string; sortOrder?: number }>;
  /**
   * Bulk create only: gallery refs keyed into the batch's `uploadedImages`
   * map (two-step image flow — POST /products/images/bulk-upload first).
   */
  images?: Record<string, BulkProductImageRef>;
}

/**
 * `POST /products` response. Note it is NOT a full product — the backend returns
 * only the identifiers plus a status line (image DB-persistence is queued, so
 * the gallery isn't readable yet at this point). Refetch the detail to render it.
 */
export interface CreateProductResult {
  /** DB UUID — the id every other endpoint takes. */
  id: string;
  /** Human-readable `PROD-XXXXXXXX` — display only. */
  productId: string;
  message: string;
}

/** An image queued in the form but not yet uploaded, in display order. */
export interface NewProductImage {
  file: File;
  isPrimary?: boolean;
}

/** Per-file image metadata accepted by the create/upload multipart endpoints. */
export interface ProductImageMeta {
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

/** Variant PATCH body (/products/{id}/variants/{variantId}). All fields optional. */
export interface UpdateVariantDto {
  name?: string;
  sku?: string;
  condition?: "NEW" | "REFURBISHED" | "USED" | "OPEN_BOX";
  sourcingType?: "INHOUSE" | "OUTSOURCED";
  price?: number;
  compareAtPrice?: number | null;
  costPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  weight?: number;
  imageUrl?: string;
  imageKey?: string;
  isActive?: boolean;
  attributes?: Array<{ name: string; value: string }>;
}

/**
 * Variant POST body (/products/{id}/variants). Same shape as the PATCH body —
 * used when a product has no variant yet and the edit form creates its default.
 */
export type CreateVariantDto = UpdateVariantDto;

/**
 * Product PATCH body. Variants are not editable through the product endpoint —
 * each is dispatched separately to /products/{id}/variants/{variantId}, so it
 * carries its DB UUID (`id`). A variant WITHOUT an `id` is treated as new and
 * POSTed to /products/{id}/variants (every product must have a default variant).
 */
export interface UpdateProductDto
  extends Partial<Omit<CreateProductDto, "variants">> {
  variants?: Array<UpdateVariantDto & { id?: string }>;
}

/** One entry in a bulk product's `images` block — `key` must exist in `uploadedImages`. */
export interface BulkProductImageRef {
  key: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface BrandInput {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
  websiteUrl?: string;
}

/** Inner payload of the bulk-create response (envelope already unwrapped). */
export interface BulkUploadResult {
  batchId: string;
  jobId: string;
  message: string;
}

export interface BulkBatchStatusRow {
  row: number;
  productName: string;
  success: boolean;
  productId?: string;
  error?: string;
}

export interface BulkBatchStatus {
  batchId: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalProducts: number;
  processedProducts: number;
  results?: BulkBatchStatusRow[];
}

/** Metadata the backend returns for one uploaded product image. */
export interface UploadedImageMeta {
  url: string;
  storagePublicId: string;
  storageProvider: string;
  width?: number;
  height?: number;
  bytes?: number;
}
