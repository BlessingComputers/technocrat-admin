import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { chunkSlideUploads } from "../utils/slide-chunks";
import type {
  CreatePromotionInput,
  Promotion,
  PromotionReorderEntry,
  PromotionSlide,
  PromotionsListEnvelope,
  PromotionsListParams,
  ReplaceSlideImagesInput,
  SlideUpload,
  UpdatePromotionInput,
  UpdateSlideInput,
} from "../types/promotions";

const { promotions, products } = API_ENDPOINTS;

export const promotionsService = {
  // `GET /promotions` returns `{ success, data, meta }` with `meta` as a
  // SIBLING of `data` (ADR-0007's known risk) — `raw: true` so `meta` survives.
  list: (params?: PromotionsListParams) =>
    api.get<PromotionsListEnvelope>(promotions.base, { params, raw: true }),

  getById: (id: string) => api.get<Promotion>(promotions.detail(id)),

  create: (data: CreatePromotionInput) =>
    api.post<Promotion>(promotions.base, data),

  update: (id: string, data: UpdatePromotionInput) =>
    api.patch<Promotion>(promotions.detail(id), data),

  delete: (id: string) =>
    api.delete<{ message: string }>(promotions.detail(id)),

  publish: (id: string) => api.post<Promotion>(promotions.publish(id)),

  archive: (id: string) => api.post<void>(promotions.archive(id)),

  /**
   * Apply placement + position to several promotions in one transaction.
   * Dragging a card within a group of six would otherwise be six PATCHes, and
   * dragging between groups would be a move plus a reorder. Either all of it
   * lands or none of it does; an unknown id 404s the whole call.
   */
  reorder: (entries: PromotionReorderEntry[]) =>
    api.patch<{ message: string }>(promotions.reorder, entries),

  // Routed through the same-origin Node proxy (see
  // app/api/admin/promotions/slides/route.ts), not the `/api/*` edge rewrite —
  // matches the product-image upload rationale (upload-proxy.ts).
  //
  // Sent in size-budgeted groups rather than one request per batch: Vercel
  // rejects a body over ~4.5 MB with a 413 before the function runs, and a
  // full carousel of banners (plus their mobile recuts) clears that easily.
  // The groups go up in order, so slides land in the order staff arranged
  // them, and the caller still sees a single operation.
  uploadSlides: async (
    promotionId: string,
    uploads: SlideUpload[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<PromotionSlide[]> => {
    const batches = chunkSlideUploads(uploads);
    const created: PromotionSlide[] = [];
    let completed = 0;
    onProgress?.(0, uploads.length);

    for (const batch of batches) {
      const slides = await promotionsService.uploadSlideBatch(promotionId, batch);
      created.push(...slides);
      completed += batch.length;
      onProgress?.(completed, uploads.length);
    }

    return created;
  },

  /**
   * One multipart request's worth of slides. Split out of `uploadSlides` so
   * the wire format lives in one place; call `uploadSlides`, not this.
   */
  uploadSlideBatch: async (
    promotionId: string,
    uploads: SlideUpload[],
  ): Promise<PromotionSlide[]> => {
    const formData = new FormData();

    // `mobileIndexes[i]` names which `files[]` entry `mobileFiles[i]` belongs
    // to. Explicit rather than positional, so the mobile array stays sparse
    // when only some slides carry a second file — which is the normal case
    // while a campaign is half-prepared. The indexes are relative to THIS
    // request, which is why a slide's two files are never split across two.
    const mobileIndexes: number[] = [];
    uploads.forEach((upload, index) => {
      formData.append("files", upload.file);
      if (upload.mobileFile) {
        formData.append("mobileFiles", upload.mobileFile);
        mobileIndexes.push(index);
      }
    });
    formData.append(
      "metadata",
      JSON.stringify(uploads.map((u) => u.metadata)),
    );
    // Required only when mobileFiles is present; sending an empty array
    // alongside no files is harmless but noisy, so omit it.
    if (mobileIndexes.length > 0) {
      formData.append("mobileIndexes", JSON.stringify(mobileIndexes));
    }

    return api.post<PromotionSlide[]>(
      `/api/admin/promotions/slides?promotionId=${encodeURIComponent(promotionId)}`,
      formData,
      { timeout: 120_000 },
    );
  },

  /** Metadata-only slide edit. Plain JSON, straight to the backend. */
  updateSlide: (promotionId: string, slideId: string, data: UpdateSlideInput) =>
    api.patch<PromotionSlide>(promotions.slide(promotionId, slideId), data),

  /**
   * Swap a slide's desktop image, its mobile image, or both, keeping its id,
   * order and link metadata. Goes through the upload proxy for the same
   * timeout reason as the create path, so it is a same-origin PATCH rather
   * than a call to `promotions.slide(...)`.
   */
  replaceSlideImages: (
    promotionId: string,
    slideId: string,
    { file, mobileFile }: ReplaceSlideImagesInput,
  ): Promise<PromotionSlide> => {
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (mobileFile) formData.append("mobileFile", mobileFile);
    const query = new URLSearchParams({ promotionId, slideId });
    return api.patch<PromotionSlide>(
      `/api/admin/promotions/slides?${query.toString()}`,
      formData,
      { timeout: 120_000 },
    );
  },

  deleteSlide: (promotionId: string, slideId: string) =>
    api.delete<{ message: string }>(promotions.slide(promotionId, slideId)),

  // Product search for a slide's "link to a product" picker. Lives here (not
  // features/products) — endpoints are in `lib/`, so this stays within the
  // feature-boundary rule. Mirrors tax's searchProducts: the products list
  // keeps `meta` as a sibling of `data`, so `raw: true` is needed to read it,
  // though only `data` is used here.
  searchProducts: async (query: string): Promise<PromotionProductOption[]> => {
    const res = await api.get<{ data: Array<{ id: string; name: string; slug: string }> }>(
      products.list,
      { params: { q: query || undefined, limit: 20, page: 1, isActive: "true" }, raw: true },
    );
    return (res?.data ?? []).map((p) => ({ id: p.slug, name: p.name }));
  },

  /**
   * The category tree, flattened to `{ slug, name }` for the targeting picker
   * (§2.11). Same feature-boundary reasoning as `searchProducts`: the endpoint
   * lives in `lib/`, so calling it here does not make promotions depend on
   * `features/products`.
   *
   * `targetCategorySlug` has no FK on the backend — a stale slug just matches
   * nothing — so children are included and depth is not enforced. Whatever a
   * product actually sits under is a legal target.
   */
  listCategoryOptions: async (): Promise<PromotionCategoryOption[]> => {
    const tree = await api.get<RawCategoryNode[]>(products.categories);
    const flat: PromotionCategoryOption[] = [];
    const walk = (nodes: RawCategoryNode[], depth: number) => {
      for (const node of nodes ?? []) {
        if (!node?.slug) continue;
        flat.push({ slug: node.slug, name: node.name, depth });
        // `children` is `Category[] | string[]` off the API; ids are useless
        // here, so only walk when they arrived expanded.
        const children = node.children;
        if (Array.isArray(children) && typeof children[0] === "object") {
          walk(children as RawCategoryNode[], depth + 1);
        }
      }
    };
    walk(tree ?? [], 0);
    return flat;
  },

  /**
   * Brands, flattened to `{ slug, name }` for a slide's link picker. Same
   * feature-boundary reasoning as `listCategoryOptions` — the endpoint lives in
   * `lib/`, so reading it here does not make promotions depend on
   * `features/products`.
   *
   * Inactive brands are dropped: a slide pointing at one would land on an empty
   * listing, and the catalog filters them out anyway.
   */
  listBrandOptions: async (): Promise<PromotionBrandOption[]> => {
    const brands = await api.get<RawBrand[]>(products.brands);
    return (brands ?? [])
      .filter((b) => b?.slug && b.isActive !== false)
      .map((b) => ({ slug: b.slug, name: b.name }));
  },
};

interface RawCategoryNode {
  id: string;
  name: string;
  slug: string;
  children?: RawCategoryNode[] | string[];
}

/** A product search result, keyed by SLUG (what a slide's `productSlug` needs). */
export interface PromotionProductOption {
  id: string;
  name: string;
}

interface RawBrand {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

/** A category the targeting picker can scope a promotion to. */
export interface PromotionCategoryOption {
  slug: string;
  name: string;
  /** Nesting level, so the picker can indent rather than flatten the tree. */
  depth: number;
}

/** A brand a slide's link can point at. */
export interface PromotionBrandOption {
  slug: string;
  name: string;
}
