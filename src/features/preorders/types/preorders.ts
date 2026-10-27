import type { components } from "@/types/api";

/**
 * Off codegen — `GET /api/v1/admin/preorders` and `/{id}` are both documented,
 * so the row shape comes from the spec rather than being hand-written.
 *
 * The status *mutation* is a different story: `PATCH /api/v1/admin/preorders/
 * {id}/status` is live but absent from the OpenAPI spec (`preorder.docs.ts`
 * was never updated for it — see BACKEND-ASKS.md item 8), so its request type
 * is hand-authored below. Its RESPONSE is a `PreOrder`, which is spec'd, so
 * only the input is hand-written. Delete `UpdatePreorderStatusInput` in favour
 * of codegen the moment that route is documented.
 */
export interface PreorderPaymentRequest {
  collectedAt?: string | null;
  collectedByStaffId?: string | null;
  collectedPaymentMethod?: components["schemas"]["PreOrderPaymentRequest"]["collectedPaymentMethod"];
  collectedTransactionReference?: components["schemas"]["PreOrderPaymentRequest"]["collectedTransactionReference"];
  totalAmount?: number;
  isSuperseded?: boolean;
  revisionOfRequestId?: string | null;
  revisionReason?: string | null;
  id: string;
  preorderId: string;
  stage: "FIRST_PAYMENT" | "BALANCE";
  collectionMethod: "TRANSFER_BEFORE_HANDOFF" | "PAY_AT_HANDOFF";
  status:
    | "PENDING"
    | "PROOF_SUBMITTED"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "EXPIRED";
  percentage: number;
  amount: number;
  payBy: string | null;
  bankAccountSnapshot: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    currency: string;
  } | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  evidence?: PreorderPaymentEvidence[];
}

export interface PreorderPaymentEvidence {
  id: string;
  paymentRequestId: string;
  fileUrl: string;
  transactionReference: string;
  customerNote: string | null;
  submittedAt: string;
  decision: "PENDING" | "APPROVED" | "REJECTED";
  decisionReason: string | null;
  decidedAt: string | null;
}

export interface PreorderPaymentSummary {
  plan: "FULL_PAYMENT" | "COMMITMENT_FEE";
  currency: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  isFullyPaid: boolean;
  firstPayment: PreorderPaymentRequest;
  balancePayment?: PreorderPaymentRequest | null;
}

export type RequestBalanceInput =
  | { collectionMethod: "TRANSFER_BEFORE_HANDOFF"; payBy: string }
  | { collectionMethod: "PAY_AT_HANDOFF" };

export type RecordHandoffCollectionInput =
  | { paymentMethod: "CASH" | "POS"; note?: string }
  | { paymentMethod: "TRANSFER"; transactionReference: string; note?: string };

export type PreorderRefund = NonNullable<components["schemas"]["PreOrderRefund"]>;
export type CancelPreorderInput = components["schemas"]["CancelPreorderBody"];
export interface CancelPreorderResult {
  preorder: Preorder;
  refund: PreorderRefund | null;
}

export interface IssuePaymentTermsInput {
  totalAmount: number;
  firstPaymentPercentage: number;
  currency: "NGN";
  payBy?: string | null;
}

export interface RejectPaymentEvidenceInput {
  decisionReason: string;
}

export type RevisePaymentTermsInput = Omit<
  components["schemas"]["RevisePaymentTermsBody"], "payBy"
> & { payBy: string };

export type ExtendPaymentDeadlineInput = Omit<
  components["schemas"]["ExtendDeadlineBody"], "payBy"
> & { payBy: string };

/**
 * The detail endpoints embed paymentSummary at runtime. The generated
 * PreOrder schema has not caught up with that documented response yet.
 */
export type Preorder = components["schemas"]["PreOrder"] & {
  paymentSummary?: PreorderPaymentSummary | null;
  /** Present after cancellation. Detail reads need a backend read-model fix to restore it. */
  refund?: PreorderRefund | null;
};

export interface PreorderReceivingAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  isPrimary: boolean;
  isActive: boolean;
}

export type PreorderStatus = Preorder["status"];

/**
 * The lifecycle in the order staff actually work it. Also the render order for
 * the queue's filter chips, so it is a tuple, not a bare union — the union
 * alone has no order, and the chips must not reshuffle between renders.
 */
export const PREORDER_STATUSES = [
  "PENDING",
  "CONTACTED",
  "CONFIRMED",
  "FULFILLED",
  "CANCELLED",
] as const satisfies readonly PreorderStatus[];

export interface PreordersListParams {
  page?: number;
  limit?: number;
  status?: PreorderStatus;
  /** Matches reference code, first/last name, email, product name, or brand. */
  search?: string;
  [key: string]: string | number | undefined;
}

/**
 * The admin list payload. Note the field names: this endpoint returns
 * `{ data, total, page, limit, totalPages }` — a FLAT `total`, not the
 * `{ data, meta }` envelope the promotions and customers lists use. Naming it
 * `meta` here would invent a nesting level the wire does not have.
 */
export interface PreordersPage {
  data: Preorder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Body of the undocumented `PATCH /admin/preorders/{id}/status`. */
export interface UpdatePreorderStatusInput {
  status: PreorderStatus;
}
