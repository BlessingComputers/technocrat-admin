import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Preorder,
  CancelPreorderInput,
  CancelPreorderResult,
  RequestBalanceInput,
  RecordHandoffCollectionInput,
  RevisePaymentTermsInput,
  ExtendPaymentDeadlineInput,
  IssuePaymentTermsInput,
  PreorderPaymentSummary,
  PreorderPaymentRequest,
  PreorderRefund,
  RejectPaymentEvidenceInput,
  PreorderReceivingAccount,
  PreordersListParams,
  PreordersPage,
  PreorderStatus,
} from "../types/preorders";

const { preorders } = API_ENDPOINTS;

/**
 * No envelope peeling here, deliberately.
 *
 * The consolidated admin dashboard controller answers through its own `ok()`
 * helper — `{ success: true, data }`, a BOOLEAN `success` — which the shared
 * client's `unwrapEnvelope` recognises and unwraps for us (ADR-0007). So
 * `api.get<PreordersPage>()` lands directly on `{ data, total, page, … }`.
 *
 * This is NOT true of every backend module: anything answering through
 * `ResponseUtil` sends `{ status: 'success', … }` with a STRING status, which
 * `isEnvelope` does not match, so those services peel `.data` by hand (see
 * `tax.service.ts`). The customer-facing preorder routes are ResponseUtil
 * ones — but we don't call those, only the admin ones, so the unwrap applies.
 * Don't copy a manual peel in here from the tax service; it would strip a
 * level that has already been stripped and leave `data` undefined.
 */

/** Drop empty/undefined params so the backend's enum validation doesn't choke. */
function cleanParams(
  params: PreordersListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== undefined && value !== null) {
      out[key] = value as string | number;
    }
  }
  return out;
}

export const preorderService = {
  cancel: (id: string, input: CancelPreorderInput): Promise<CancelPreorderResult> =>
    api.post<CancelPreorderResult>(preorders.cancel(id), input),
  markRefunded: (refundId: string): Promise<PreorderRefund> =>
    api.post<PreorderRefund>(preorders.markRefunded(refundId)),
  requestBalance: (id: string, input: RequestBalanceInput): Promise<PreorderPaymentSummary> =>
    api.post<PreorderPaymentSummary>(preorders.requestBalance(id), input),
  recordHandoffCollection: (
    requestId: string,
    input: RecordHandoffCollectionInput,
  ): Promise<PreorderPaymentSummary> =>
    api.post<PreorderPaymentSummary>(preorders.collectPayment(requestId), input),
  revisePaymentTerms: (id: string, input: RevisePaymentTermsInput): Promise<PreorderPaymentSummary> =>
    api.patch<PreorderPaymentSummary>(preorders.revisePaymentTerms(id), input),

  extendPaymentDeadline: (requestId: string, input: ExtendPaymentDeadlineInput): Promise<PreorderPaymentSummary> =>
    api.post<PreorderPaymentSummary>(preorders.extendPaymentDeadline(requestId), input),

  list: (params: PreordersListParams): Promise<PreordersPage> =>
    api.get<PreordersPage>(preorders.base, { params: cleanParams(params) }),

  /**
   * A single pre-order by internal UUID.
   *
   * Worth knowing: the backend's `adminGetPreOrderById` is a bare
   * `findUnique` with no `include`, so this returns exactly the same shape as
   * a list row — the OpenAPI summary's "full customer + product detail" is
   * already satisfied by the row's own denormalised columns, not by a join.
   * That is why the detail view needs no second request, and why seeding this
   * query from the list cache is sound rather than a partial-data shortcut.
   */
  get: (id: string): Promise<Preorder> =>
    api.get<Preorder>(preorders.detail(id)),

  getReceivingAccounts: (): Promise<PreorderReceivingAccount[]> =>
    api.get<PreorderReceivingAccount[]>(
      API_ENDPOINTS.adminCheckout.bankAccounts.base,
    ),

  issuePaymentTerms: (
    id: string,
    input: IssuePaymentTermsInput,
  ): Promise<PreorderPaymentSummary> =>
    api.patch<PreorderPaymentSummary>(preorders.paymentTerms(id), input),

  getPaymentHistory: (id: string): Promise<PreorderPaymentRequest[]> =>
    api.get<PreorderPaymentRequest[]>(preorders.paymentHistory(id)),

  reviewPaymentEvidence: (requestId: string): Promise<PreorderPaymentRequest> =>
    api.post<PreorderPaymentRequest>(preorders.paymentRequestReview(requestId)),

  approvePaymentEvidence: (
    requestId: string,
  ): Promise<PreorderPaymentSummary> =>
    api.post<PreorderPaymentSummary>(
      preorders.paymentRequestApprove(requestId),
    ),

  rejectPaymentEvidence: (
    requestId: string,
    input: RejectPaymentEvidenceInput,
  ): Promise<PreorderPaymentSummary> =>
    api.post<PreorderPaymentSummary>(
      preorders.paymentRequestReject(requestId),
      input,
    ),

  /**
   * Move a pre-order along its lifecycle. Requires preorders:terms:issue.
   *
   * The backend does not constrain the transition — any status may move to any
   * other, including backwards out of a terminal state. That is deliberate on
   * our side too: the ordering staff actually follow is expressed in the UI
   * (see `nextStatus` in `../utils/preorder-utils`), while corrections stay
   * possible, because the alternative is a mis-click becoming permanent.
   *
   * Returns the updated row, so callers can seed the cache instead of refetching.
   */
  updateStatus: (id: string, status: PreorderStatus): Promise<Preorder> =>
    api.patch<Preorder>(preorders.status(id), { status }),
};
