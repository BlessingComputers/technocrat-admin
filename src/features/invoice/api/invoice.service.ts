import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Invoice,
  InvoiceDashboard,
  InvoiceListEnvelope,
  InvoiceListMeta,
  InvoiceListParams,
  ManualInvoice,
  ManualInvoiceListItem,
  ManualInvoiceListParams,
  ManualInvoiceListResult,
  RefundItemInput,
  RefundRecord,
  RejectedInvoicesEnvelope,
  StaffWorkload,
  SubmitReviewItem,
} from "../types/invoice";
import type { CreateManualInvoiceInput } from "../schemas/manual-invoice";

const E = API_ENDPOINTS.invoice;

/** Drop empty strings/undefined so backend enum validation doesn't choke. */
function cleanParams(
  params: Record<string, string | number | undefined>,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * Map the manual-list response into `{ data, meta }`. The endpoint returns
 * `{ success, data: [...], pagination }` (pagination is a sibling of data, not
 * nested `meta`), so we read the array and translate `pagination` → `meta`.
 */
function normalizeManualList(
  raw: unknown,
  params: ManualInvoiceListParams,
): ManualInvoiceListResult {
  const root = (raw ?? {}) as Record<string, unknown>;
  const payload = root.data;
  const nested = (payload ?? {}) as Record<string, unknown>;
  const data = (
    Array.isArray(payload) ? payload : (nested.data ?? [])
  ) as ManualInvoiceListItem[];

  const p = (root.pagination ?? root.meta ?? nested.pagination ?? {}) as Record<
    string,
    unknown
  >;
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  const total = num(p.total, Array.isArray(data) ? data.length : 0);
  const limit = num(p.limit, params.limit ?? 20);
  const page = num(p.page, params.page ?? 1);
  const totalPages = num(
    p.totalPages,
    Math.max(1, Math.ceil(total / Math.max(1, limit))),
  );

  const meta: InvoiceListMeta = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return { data: Array.isArray(data) ? data : [], meta };
}

export const invoiceService = {
  // ── Dashboard ──────────────────────────────────────────────────
  getDashboard: () => api.get<InvoiceDashboard>(E.dashboard),

  getStaffWorkload: () => api.get<StaffWorkload[]>(E.staffWorkload),

  // ── Lists ──────────────────────────────────────────────────────
  getInvoices: (params: InvoiceListParams) =>
    api.get<InvoiceListEnvelope>(E.list, {
      params: cleanParams(params),
      raw: true,
    }),

  getPendingReview: (params: InvoiceListParams) =>
    api.get<InvoiceListEnvelope>(E.pendingReview, {
      params: cleanParams(params),
      raw: true,
    }),

  getRejected: (params: InvoiceListParams) =>
    api.get<RejectedInvoicesEnvelope>(E.rejected, {
      params: cleanParams(params),
      raw: true,
    }),

  // ── Manual (offline) invoices ──────────────────────────────────
  getManualInvoices: async (
    params: ManualInvoiceListParams,
  ): Promise<ManualInvoiceListResult> => {
    const raw = await api.get<unknown>(E.manual.base, {
      params: cleanParams(params),
      raw: true,
    });
    return normalizeManualList(raw, params);
  },

  getManualInvoice: (manualInvoiceId: string) =>
    api.get<ManualInvoice>(E.manual.detail(manualInvoiceId)),

  createManualInvoice: (data: CreateManualInvoiceInput) =>
    api.post<ManualInvoice>(E.manual.base, data),

  cancelManualInvoice: (manualInvoiceId: string) =>
    api.post<ManualInvoice>(E.manual.cancel(manualInvoiceId)),

  // ── Detail ─────────────────────────────────────────────────────
  getInvoice: (invoiceId: string) => api.get<Invoice>(E.detail(invoiceId)),

  getRefundItems: (invoiceId: string) =>
    api.get<RefundRecord[]>(E.refundItems(invoiceId)),

  // ── Claim queue (outsourced) ───────────────────────────────────
  claim: (invoiceId: string) => api.post<Invoice>(E.claim(invoiceId)),

  unclaim: (invoiceId: string) => api.post<Invoice>(E.unclaim(invoiceId)),

  reassign: (invoiceId: string, staffId: string) =>
    api.post<Invoice>(E.reassign(invoiceId), { staffId }),

  // ── Review / refund ────────────────────────────────────────────
  submitReview: (invoiceId: string, itemReviews: SubmitReviewItem[]) =>
    api.post<{ jobId: string }>(E.submitReview(invoiceId), { itemReviews }),

  refund: (invoiceId: string, items: RefundItemInput[]) =>
    api.post<Invoice>(E.refund(invoiceId), { items }),

  confirmRefund: (invoiceId: string, refundItemIds?: string[]) =>
    api.post<Invoice>(
      E.confirmRefund(invoiceId),
      refundItemIds ? { refundItemIds } : undefined,
    ),
};
