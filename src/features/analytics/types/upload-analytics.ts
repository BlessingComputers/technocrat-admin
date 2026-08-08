import type { paths, components } from "@/types/api";

/**
 * Types for the per-uploader upload analytics (`GET /v1/analytics/uploaders`).
 * Aliased from the generated OpenAPI types (ADR-0006) so they track the backend
 * contract; do not hand-maintain the shape.
 */

/** One staff member's upload breakdown vs their daily target. */
export type UploaderSummary = components["schemas"]["UploaderSummary"];

/** A staff member's individual (custom) daily upload target. */
export type UploadTarget = components["schemas"]["UploadTarget"];

type UploadersOk =
  paths["/api/v1/analytics/uploaders"]["get"]["responses"][200]["content"]["application/json"];

/** Inner payload of the uploaders endpoint (client unwraps the envelope, ADR-0007). */
export type UploadAnalyticsData = UploadersOk["data"];

/** Query params for the uploaders report. `startDate`/`endDate` are `YYYY-MM-DD`. */
export interface UploaderAnalyticsParams {
  startDate: string;
  endDate: string;
  /** Fallback target for staff without an individual target (backend default: 10). */
  dailyTarget?: number;
  /** Filter to a single uploader (DB UUID). */
  staffId?: string;
  // Index signature keeps this assignable to the client's query-param type.
  [key: string]: string | number | boolean | undefined;
}

// ── Drill-down: an uploader's actual items ──────────────────────────

/** GET /products/all body — read with `{ raw: true }`, so `status`/`meta` survive. */
export type UploaderProductsResponse =
  paths["/api/v1/products/all"]["get"]["responses"][200]["content"]["application/json"];

/** GET /products/parts inner payload (client unwraps the success envelope). */
export type UploaderPartsResponse =
  paths["/api/v1/products/parts"]["get"]["responses"][200]["content"]["application/json"]["data"];

/** Shared pagination meta for both item lists. */
export type ItemsMeta = UploaderProductsResponse["meta"];

/** Pull one uploader's items within a date window. `startDate`/`endDate` are `YYYY-MM-DD`. */
export interface UploaderItemsParams {
  staffId: string;
  startDate: string;
  endDate: string;
  page?: number;
  sortBy?: "newest" | "oldest";
}

/** A product or part normalised for the shared item list. */
export interface UploaderItem {
  key: string;
  image: string | null;
  title: string;
  code: string;
  createdAt: string;
  price: number | null;
}
