import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  CreatePromotionInput,
  Promotion,
  PromotionSlide,
  PromotionsListEnvelope,
  PromotionsListParams,
  SlideUploadMetadata,
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

  // Routed through the same-origin Node proxy (see
  // app/api/admin/promotions/slides/route.ts), not the `/api/*` edge rewrite —
  // matches the product-image upload rationale (upload-proxy.ts).
  uploadSlides: async (
    promotionId: string,
    files: File[],
    metadata: SlideUploadMetadata[],
  ): Promise<PromotionSlide[]> => {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    formData.append("metadata", JSON.stringify(metadata));
    return api.post<PromotionSlide[]>(
      `/api/admin/promotions/slides?promotionId=${encodeURIComponent(promotionId)}`,
      formData,
      { timeout: 120_000 },
    );
  },

  updateSlide: (promotionId: string, slideId: string, data: UpdateSlideInput) =>
    api.patch<PromotionSlide>(promotions.slide(promotionId, slideId), data),

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
};

/** A product search result, keyed by SLUG (what a slide's `productSlug` needs). */
export interface PromotionProductOption {
  id: string;
  name: string;
}
