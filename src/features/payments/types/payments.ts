import type { components } from "@/types/api";

/**
 * Payments feature types. The list/detail shapes come straight off codegen
 * (`AdminTransactionListItem`/`AdminTransactionDetail` — PAYMENTS-BACKEND-CONTRACT.md
 * §3/§4); the rest (DLQ, Miden tools, notifications identity) are hand-typed
 * because those endpoints' schemas are partly untyped on the wire.
 */

export type AdminTransactionListItem =
  components["schemas"]["AdminTransactionListItem"];
export type AdminTransactionDetail =
  components["schemas"]["AdminTransactionDetail"];
export type RecordRefundRequest = components["schemas"]["RecordRefundRequest"];
export type RefundResponse = components["schemas"]["RefundResponse"];

export interface AdminTransactionListParams {
  page: number;
  limit: number;
  search?: string;
  status?: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "";
  channel?: string;
  from?: string;
  to?: string;
}

export interface AdminTransactionListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── DLQ (BACKEND-CONTRACT-DELTA §3.3 — identity fields nest one level deeper
// than originally asked: `entry.data.paymentId`, not `entry.paymentId`) ──────

export type DlqJobType = "VERIFY" | "WEBHOOK" | "NOTIFY";

export interface DlqEntry {
  id: string;
  /** Unix ms timestamp of when it was dead-lettered. */
  enqueuedAt: number;
  data: {
    originalJobId: string;
    originalJobName: string;
    type: DlqJobType;
    payload?: unknown;
    failedReason: string;
    attemptsMade: number;
    failedAt: string;
    paymentId: string | null;
    reference: string | null;
    orderId: string | null;
  };
}

export interface DlqListParams {
  page: number;
  limit: number;
  type?: DlqJobType | "";
  from?: string;
  to?: string;
}

export interface DlqListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  entries: DlqEntry[];
}

// ── Miden tooling ─────────────────────────────────────────────────────────

export interface CircuitHealthResponse {
  circuit: "Closed" | "Open" | "HalfOpen";
}

export interface MidenWebhookRegisterResponse {
  isSuccessful: true;
  responseMessage: string;
  webhookUrl: string;
}

export interface MidenWebhookResendResponse {
  isSuccessful: true;
  responseMessage: string;
}

/**
 * `GET /payments/miden/lookup/{reference}` is documented as "same shape as
 * GET /verify/{reference}'s response" but ships with `content?: never` in the
 * OpenAPI spec — genuinely untyped on the wire. This captures the fields the
 * docs promise; `gatewayResponse` stays `unknown` and renders as raw JSON.
 */
export interface MidenLookupResult {
  status?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentId?: string;
  gatewayResponse?: unknown;
  [key: string]: unknown;
}
