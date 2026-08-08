// Types for the parts feature. Response/read shapes are aliased from the
// generated OpenAPI types (ADR-0006: codegen owns outputs); request inputs are
// owned by the Zod schema in `../schemas/part-form`.
//
// A Part is like a simpler product: pricing/stock live directly on the part
// (no variants). Category + brand reuse the product taxonomy; partType is its
// own managed entity (PartTypeResponse).

import type { components } from "@/types/api";

type Schemas = components["schemas"];

// ── Response shapes ────────────────────────────────────────────────────

export type Part = Schemas["PartResponse"];
export type PartType = Schemas["PartTypeResponse"];
/** Taxonomy reused by the part form/filters (parts can't import the products feature). */
export type Category = Schemas["Category"];
export type Brand = Schemas["Brand"];
export type PartImage = Part["images"][number];
export type PartSpecification = Part["specifications"][number];

/** One linked part inside a product's compatible-parts list. */
export type ProductPartLink = Schemas["ProductPartEmbed"];
/** A product's compatible parts, grouped by category name. */
export type PartsByCategory = Schemas["PartsByCategory"];

/**
 * The part detail the edit form reads. `PartResponse` does not yet echo
 * `categoryId`, `brandId`, or `costPrice` (backend ask #1) — declared here as
 * optional so the form pre-fills them the moment the backend starts returning
 * them, and degrades to blank until then. Same for the per-image storage fields
 * the delete endpoint needs (backend ask), absent from `PartResponse.images`.
 */
export type PartDetail = Part & {
  slug?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  brandId?: string;
  costPrice?: number | null;
  // `variantId` (purchasable handle) is now a real field on PartResponse.
};

export type PartImageWithStorage = PartImage & {
  storagePublicId?: string;
  storageProvider?: "cloudinary" | "s3";
};

// ── Request DTOs (aliased; the Zod schema produces these) ──────────────

export type CreatePartDto = Schemas["CreatePartRequest"];
export type UpdatePartDto = Schemas["UpdatePartRequest"];
export type LinkPartDto = Schemas["LinkPartRequest"];
export type BulkLinkPartsDto = Schemas["BulkLinkPartsRequest"];
export type ReorderPartsDto = Schemas["ReorderPartsRequest"];
export type UpdatePartLinkDto = Schemas["UpdatePartLinkRequest"];

/** POST /parts/part-types body (inline in the spec — hand-typed). */
export interface CreatePartTypeDto {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

/** Body the part image-delete endpoint requires (from the part's image row). */
export interface DeletePartImageDto {
  storagePublicId: string;
  storageProvider: "cloudinary" | "s3";
}

/**
 * One already-uploaded image passed back to the create-part payload. The image
 * files are uploaded first via `bulkUploadPartImages` (visible feedback), then
 * their url + storage metadata ride in `CreatePartRequest.preUploadedImages` so
 * the JSON create is instant — the backend just links images already on S3.
 */
export type PreUploadedPartImage = NonNullable<
  CreatePartDto["preUploadedImages"]
>[number];

// ── List params + envelope ─────────────────────────────────────────────

/** Internal filter state for the parts list (mapped to backend query params). */
export interface PartsListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  partType?: string;
  isActive?: boolean;
  isInStock?: boolean;
}

export interface PartsListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Inner payload of the list response. The client unwraps the outer envelope
 * (ADR-0007), leaving `{ data, meta }` — both survive because `meta` is nested
 * alongside the array (unlike products, where it's a sibling needing `raw`).
 */
export interface PartsListEnvelope {
  data: Part[];
  meta: PartsListMeta;
}

/** Inner payload of the create-part response. */
export interface CreatePartResult {
  id: string;
  partId: string;
  message?: string;
}

// ── Bulk edit / delete ─────────────────────────────────────────────────
// Multi-select edit / soft-delete across existing parts. `partIds` are DB UUIDs
// (Part.id), NOT the human partId. Only categorical/shared fields are editable —
// name/slug/price/stock are per-item-unique (backend rejects them). At least one
// editable field must be present. isActive/isInStock also propagate to each
// part's backing variant.

export interface BulkEditPartsInput {
  partIds: string[];
  categoryId?: string;
  brandId?: string;
  partTypeId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isInStock?: boolean;
}

/** `POST /parts/bulk-edit` result — how many rows matched/updated. */
export interface BulkEditPartsResult {
  updated: number;
}

/** `POST /parts/bulk-delete` result — soft-deactivated count. */
export interface BulkDeletePartsResult {
  deactivated: number;
}

// ── Bulk create (mirrors the product bulk flow) ────────────────────────

/** Metadata the backend returns for one bulk-uploaded part image (Step 1). */
export interface UploadedImageMeta {
  url: string;
  storagePublicId: string;
  storageProvider: "cloudinary" | "s3";
  width?: number;
  height?: number;
  bytes?: number;
}

/** One image ref on a bulk part — `key` must exist in the batch `uploadedImages`. */
export interface BulkPartImageRef {
  key: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

/** Body of POST /products/parts/bulk (Step 2). */
export interface BulkCreatePartsDto {
  idempotencyKey: string;
  /** Key→metadata map from Step 1 (`bulkUploadPartImages`); `{}` when no images. */
  uploadedImages: Record<string, UploadedImageMeta>;
  parts: CreatePartDto[];
}

/** Inner payload of the bulk-create response. */
export interface BulkCreatePartsResult {
  batchId: string;
  jobId: string;
  idempotencyKey: string;
  message: string;
}

export interface PartBulkBatchStatusRow {
  row: number;
  partName?: string;
  success: boolean;
  partId?: string;
  error?: string;
}

/** Batch status (the spec leaves the 200 body untyped — mirrors product shape). */
export interface PartBulkBatchStatus {
  batchId: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalParts: number;
  processedParts: number;
  results?: PartBulkBatchStatusRow[];
}
