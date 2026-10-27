import type { components } from "@/types/api";
import type { PlacementKey } from "../constants/placements";

/** Off codegen (`Promotion`/`PromotionSlide`) — GET /promotions & sub-routes. */
export type Promotion = components["schemas"]["Promotion"];
export type PromotionSlide = components["schemas"]["PromotionSlide"];
export type PromotionStatus = Promotion["status"];

export interface PromotionsListParams {
  status?: PromotionStatus;
  /** Comma-separated placement keys. Absent = every placement. */
  placement?: string;
  /** Applies the (startAt, endAt) window server-side. */
  active?: boolean;
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

/**
 * The three placement fields, shared by create and update because the backend
 * accepts all three on both. `placement` is typed as `PlacementKey` on the way
 * *out* even though the column is a plain string — we only ever write keys we
 * know. Reads stay `string`, because a row placed by an older build (or a
 * removed slot) is exactly the "Unplaced" case the list view handles.
 */
export interface PromotionPlacementInput {
  placement?: PlacementKey;
  isFallback?: boolean;
  targetCategorySlug?: string | null;
}

/** `POST /promotions` body — creates a DRAFT shell. */
export interface CreatePromotionInput extends PromotionPlacementInput {
  title: string;
  description?: string;
  position?: number;
  startAt?: string | null;
  endAt?: string | null;
}

/** `PATCH /promotions/:id` body — metadata only, slides use their own routes. */
export interface UpdatePromotionInput extends PromotionPlacementInput {
  title?: string;
  description?: string | null;
  position?: number;
  startAt?: string | null;
  endAt?: string | null;
}

/**
 * One entry of `PATCH /promotions/reorder`. All three fields are required: the
 * endpoint carries `placement` alongside `position` so dragging a card between
 * two slot groups is a single transactional call rather than a move plus a
 * reorder (`CONTRACT.md` §1). It 404s if any id is unknown, so send the whole
 * group in one payload or none of it.
 */
export interface PromotionReorderEntry {
  id: string;
  placement: string;
  position: number;
}

/** One entry of the `metadata` JSON array sent alongside `POST /:id/slides`. */
export interface SlideUploadMetadata {
  description?: string | null;
  productId?: string | null;
  productSlug?: string | null;
  externalUrl?: string | null;
}

/**
 * A slide about to be uploaded: its desktop file, its optional mobile
 * recomposition, and the metadata row that goes with it.
 *
 * The wire format is not this shape. `POST /:id/slides` takes three parallel
 * fields — `files[]`, `mobileFiles[]` and a `mobileIndexes` JSON array where
 * `mobileIndexes[i]` names which `files[]` index `mobileFiles[i]` belongs to.
 * The mapping is explicit rather than positional precisely so `mobileFiles`
 * can be sparse, which it is whenever some slides have a mobile file and
 * others do not. `promotions.service.ts` does that flattening; nothing above
 * it should have to think in parallel arrays.
 */
export interface SlideUpload {
  file: File;
  mobileFile?: File | null;
  metadata: SlideUploadMetadata;
}

/** `PATCH /promotions/:id/slides/:slideId` body (the JSON form). */
export interface UpdateSlideInput {
  description?: string | null;
  productId?: string | null;
  productSlug?: string | null;
  externalUrl?: string | null;
  order?: number;
}

/**
 * `PATCH /promotions/:id/slides/:slideId` as multipart — replaces one or both
 * of a slide's images in place. The backend uploads before deleting, so a
 * failed upload never leaves a slide imageless. Sending neither file is
 * pointless; use the JSON form for a metadata-only edit.
 */
export interface ReplaceSlideImagesInput {
  file?: File | null;
  mobileFile?: File | null;
}
