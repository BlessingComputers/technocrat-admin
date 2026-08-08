import type { components } from "@/types/api";

/** Off codegen (`Promotion`/`PromotionSlide`) — GET /promotions & sub-routes. */
export type Promotion = components["schemas"]["Promotion"];
export type PromotionSlide = components["schemas"]["PromotionSlide"];
export type PromotionStatus = Promotion["status"];

export interface PromotionsListParams {
  status?: PromotionStatus;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface PromotionsListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PromotionsListEnvelope {
  success?: boolean;
  data: Promotion[];
  meta: PromotionsListMeta;
}

/** `POST /promotions` body — creates a DRAFT shell. */
export interface CreatePromotionInput {
  title: string;
  description?: string;
  position?: number;
  startAt?: string | null;
  endAt?: string | null;
}

/** `PATCH /promotions/:id` body — metadata only, slides use their own routes. */
export interface UpdatePromotionInput {
  title?: string;
  description?: string | null;
  position?: number;
  startAt?: string | null;
  endAt?: string | null;
}

/** One entry of the `metadata` JSON array sent alongside `POST /:id/slides`. */
export interface SlideUploadMetadata {
  description?: string | null;
  productId?: string | null;
  productSlug?: string | null;
  externalUrl?: string | null;
}

/** `PATCH /promotions/:id/slides/:slideId` body. */
export interface UpdateSlideInput {
  description?: string | null;
  productId?: string | null;
  productSlug?: string | null;
  externalUrl?: string | null;
  order?: number;
}
