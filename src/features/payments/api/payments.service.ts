import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdminTransactionDetail,
  AdminTransactionListItem,
  AdminTransactionListParams,
  CircuitHealthResponse,
  DlqListParams,
  DlqListResponse,
  MidenLookupResult,
  MidenWebhookRegisterResponse,
  MidenWebhookResendResponse,
  RecordRefundRequest,
  RefundResponse,
} from "../types/payments";

/** Drop empty-string/undefined params so backend enum validation doesn't choke. */
function clean(params: object): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params) as [
    string,
    string | number | undefined,
  ][]) {
    if (value !== "" && value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * Every SUPER_ADMIN mutation on `/payments/*` (replay, refund, Miden webhook
 * register/resend) sits behind `csrfProtection()` on the backend, not just the
 * public checkout `/initiate` path — confirmed in `payment.routes.ts`. This
 * app authenticates via httpOnly cookies (same as the customer app's
 * `payments.service.ts`, which this mirrors), so it needs the double-submit
 * token: fetch fresh right before the call so the paired `csrf-token` cookie
 * is guaranteed present, then echo it as `X-CSRF-Token`. That cookie is
 * `Secure`, so this only works when the app is served over HTTPS
 * (`npm run dev:https` locally) — over plain `http://localhost` the cookie
 * side is silently dropped and the call 403s regardless of this header.
 */
async function withCsrf<T>(
  call: (headers: { "X-CSRF-Token": string }) => Promise<T>,
): Promise<T> {
  const { csrfToken } = await api.get<{ csrfToken: string }>(
    API_ENDPOINTS.payments.csrfToken,
  );
  return call({ "X-CSRF-Token": csrfToken });
}

export const paymentsService = {
  // `/admin/transactions` nests pagination INSIDE `data`
  // (`{ data, total, page, limit, totalPages }`), so the envelope unwrap alone
  // (ADR-0007) already returns that whole shape — no `{ raw: true }` needed.
  getTransactions: (params: AdminTransactionListParams) =>
    api.get<{
      data: AdminTransactionListItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(API_ENDPOINTS.adminTransactions.list, { params: clean(params) }),

  getTransactionDetail: (paymentId: string) =>
    api.get<AdminTransactionDetail>(
      API_ENDPOINTS.adminTransactions.detail(paymentId),
    ),

  recordRefund: (data: RecordRefundRequest) =>
    withCsrf((headers) =>
      api.post<RefundResponse>(API_ENDPOINTS.payments.refund, data, {
        headers,
      }),
    ),

  // Same nesting shape as transactions — `entries` sits inside `data`.
  getDlq: (params: DlqListParams) =>
    api.get<DlqListResponse>(API_ENDPOINTS.payments.dlq, {
      params: clean(params),
    }),

  replayDlqEntry: (id: string) =>
    withCsrf((headers) =>
      api.post<{ replayed: true }>(API_ENDPOINTS.payments.dlqReplay(id), undefined, {
        headers,
      }),
    ),

  getCircuitHealth: () =>
    api.get<CircuitHealthResponse>(API_ENDPOINTS.payments.circuitHealth),

  registerMidenWebhook: (baseUrl: string) =>
    withCsrf((headers) =>
      api.post<MidenWebhookRegisterResponse>(
        API_ENDPOINTS.payments.midenWebhooks,
        { baseUrl },
        { headers },
      ),
    ),

  resendMidenWebhook: (transactionIds: number[]) =>
    withCsrf((headers) =>
      api.post<MidenWebhookResendResponse>(
        API_ENDPOINTS.payments.midenWebhooksResend,
        { transactionIds },
        { headers },
      ),
    ),

  lookupMidenTransaction: (reference: string) =>
    api.get<MidenLookupResult>(API_ENDPOINTS.payments.midenLookup(reference)),
};
