import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  BulkCreatePartsDto,
  BulkCreatePartsResult,
  BulkDeletePartsResult,
  BulkEditPartsInput,
  BulkEditPartsResult,
  BulkLinkPartsDto,
  CreatePartDto,
  CreatePartResult,
  CreatePartTypeDto,
  DeletePartImageDto,
  LinkPartDto,
  Part,
  PartBulkBatchStatus,
  PartImage,
  PartType,
  PartsByCategory,
  PartsListEnvelope,
  PartsListParams,
  ReorderPartsDto,
  UpdatePartDto,
  UpdatePartLinkDto,
  UploadedImageMeta,
} from "../types/parts";

/**
 * Parts data access. The client unwraps the response envelope (ADR-0007), so
 * `api.*` returns the inner payload directly. The list payload is `{ data, meta }`
 * (meta nested with the array), so a plain unwrap keeps both — no `raw` needed.
 */

const { parts, productParts } = API_ENDPOINTS.products;

type QueryParams = Record<string, string | number | boolean | undefined>;

function buildListParams(params?: PartsListParams): QueryParams {
  return {
    page: params?.page || 1,
    limit: params?.limit || 20,
    q: params?.search || undefined,
    categoryId: params?.categoryId || undefined,
    brandId: params?.brandId || undefined,
    partType: params?.partType || undefined,
    isActive:
      params?.isActive !== undefined ? String(params.isActive) : undefined,
    isInStock:
      params?.isInStock !== undefined ? String(params.isInStock) : undefined,
  };
}

export const partsService = {
  // ── Parts CRUD ─────────────────────────────────────────────────────
  getParts: (params?: PartsListParams) =>
    api.get<PartsListEnvelope>(parts.list, { params: buildListParams(params) }),

  getPart: (partId: string) => api.get<Part>(parts.detail(partId)),

  /**
   * Create a part (plain JSON). Images are uploaded first via
   * `bulkUploadPartImages` and passed back in `data.preUploadedImages` (url +
   * storage metadata), so the create is instant with no file transfer or timeout
   * risk — the backend just queues the DB rows for images already on S3. Mirrors
   * the bulk-create flow; keeps image upload feedback visible before create.
   */
  createPart: (data: CreatePartDto) =>
    api.post<CreatePartResult>(parts.base, data),

  updatePart: (partId: string, data: UpdatePartDto) =>
    api.patch<{ message: string }>(parts.detail(partId), data),

  /** Soft-delete (isActive = false). Product links are preserved. */
  deactivatePart: (partId: string) => api.delete<void>(parts.detail(partId)),

  /**
   * Hard-delete — permanently removes the part and cascades its product links,
   * images, and specifications. Cannot be undone. The backend returns 409 when
   * the part is blocked from deletion — the caller surfaces that message.
   */
  permanentlyDeletePart: (partId: string) =>
    api.delete<{ message?: string }>(parts.permanent(partId)),

  /**
   * Multi-select edit across existing parts (synchronous `updateMany`). Only
   * categorical/shared fields — `partIds` are DB UUIDs. isActive/isInStock also
   * propagate to each part's backing variant server-side.
   */
  bulkEditParts: (data: BulkEditPartsInput) =>
    api.post<BulkEditPartsResult>(parts.bulkEdit, data),

  /** Multi-select soft-delete (deactivate) — mirrors DELETE /:id, not /permanent. */
  bulkDeleteParts: (partIds: string[]) =>
    api.post<BulkDeletePartsResult>(parts.bulkDelete, { partIds }),

  // ── Part images ────────────────────────────────────────────────────
  // ONE image per request through the same-origin Node handler, mirroring
  // products: the backend's per-image receive→process→store time blows the
  // hosting function's duration limit when several share a request → 504. The
  // handler (app/api/admin/parts/images/upload) takes partId as a query param.
  uploadPartImages: async (
    partId: string,
    files: File[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<PartImage[]> => {
    const uploaded: PartImage[] = [];
    onProgress?.(0, files.length);
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("images", files[i]);
      const result = await api.post<{ images?: PartImage[] } | PartImage[]>(
        `/api/admin/parts/images/upload?partId=${encodeURIComponent(partId)}`,
        formData,
        { timeout: 120_000 },
      );
      uploaded.push(
        ...(Array.isArray(result) ? result : (result.images ?? [])),
      );
      onProgress?.(i + 1, files.length);
    }
    return uploaded;
  },

  /**
   * Delete a part image. The endpoint requires `storagePublicId` +
   * `storageProvider`, which are NOT yet on the part's image rows (backend ask)
   * — passed through here so it works the moment the backend exposes them.
   */
  deletePartImage: (
    partId: string,
    imageId: string,
    body: DeletePartImageDto,
  ) => api.delete<void>(parts.image(partId, imageId), { data: body }),

  setPartPrimaryImage: (partId: string, imageId: string) =>
    api.patch<{ message: string }>(parts.imagePrimary(partId, imageId)),

  // ── Part types (manage: create + list only; PATCH/DELETE pending) ──
  getPartTypes: () => api.get<PartType[]>(parts.types),

  createPartType: (data: CreatePartTypeDto) =>
    api.post<PartType>(parts.types, data),

  // ── Bulk create (two-step, mirrors products) ───────────────────────
  // Step 1: pre-upload images, get a key→metadata map. Routed through the
  // same-origin Node handler (app/api/admin/parts/images/bulk-upload), NOT the
  // `/api/*` edge rewrite, whose ~30s window 504s the upload+store round-trip.
  bulkUploadPartImages: async (
    files: { file: File; key: string }[],
  ): Promise<Record<string, UploadedImageMeta>> => {
    const formData = new FormData();
    const keys: string[] = [];
    for (const { file, key } of files) {
      formData.append("images", file);
      keys.push(key);
    }
    formData.append("keys", JSON.stringify(keys));
    const result = await api.post<{
      images: Record<string, UploadedImageMeta>;
    }>(`/api/admin/parts/images/bulk-upload`, formData, { timeout: 120_000 });
    return result.images;
  },

  // Step 2: queue the bulk create, referencing the Step-1 keys.
  bulkCreateParts: (data: BulkCreatePartsDto) =>
    api.post<BulkCreatePartsResult>(parts.bulk, data),

  getPartBulkBatchStatus: (batchId: string) =>
    api.get<PartBulkBatchStatus>(`${parts.bulk}/${batchId}`),

  // ── Product↔part links (compatible parts) ──────────────────────────
  getProductParts: (
    productId: string,
    params?: { productId: string; partType?: string; isInStock?: boolean },
  ) =>
    api.get<PartsByCategory>(productParts.list(productId), {
      params: {
        productId: params?.productId,
        partType: params?.partType,
        isInStock:
          params?.isInStock !== undefined
            ? String(params.isInStock)
            : undefined,
      },
    }),

  linkPart: (productId: string, data: LinkPartDto) =>
    api.post<{ linkId: string; message?: string }>(
      productParts.list(productId),
      data,
    ),

  bulkLinkParts: (productId: string, data: BulkLinkPartsDto) =>
    api.post<{ linked: number; results: unknown[] }>(
      productParts.bulk(productId),
      data,
    ),

  reorderProductParts: (productId: string, data: ReorderPartsDto) =>
    api.patch<{ message: string }>(productParts.reorder(productId), data),

  updateProductPartLink: (
    productId: string,
    partId: string,
    data: UpdatePartLinkDto,
  ) =>
    api.patch<{ message: string }>(productParts.link(productId, partId), data),

  unlinkPart: (productId: string, partId: string) =>
    api.delete<void>(productParts.link(productId, partId)),
};
