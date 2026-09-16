import type { Preorder } from "../types/preorders";

export type PreorderPaymentStatus =
  | Preorder["depositStatus"]
  | "UNDER_REVIEW"
  | "EXPIRED";

export type PreorderPaymentCollectionMethod =
  | "TRANSFER_BEFORE_HANDOFF"
  | "PAY_AT_HANDOFF";

type PaymentTerms = Pick<
  Preorder,
  "totalAmount" | "depositPercentage" | "depositAmount" | "balanceAmount"
>;

export type PreorderPaymentView =
  | { kind: "none" }
  | {
      kind: "commitment_fee";
      currency: "NGN";
      totalAmount: number;
      firstPaymentAmount: number;
      firstPaymentPercentage: number;
      balanceAmount: number;
    }
  | {
      kind: "full_payment";
      currency: "NGN";
      totalAmount: number;
      firstPaymentAmount: number;
      firstPaymentPercentage: 100;
    };

const PAYMENT_STATUS_LABELS: Record<PreorderPaymentStatus, string> = {
  NOT_REQUESTED: "Not requested",
  PENDING: "Payment due",
  PROOF_SUBMITTED: "Receipt submitted",
  UNDER_REVIEW: "Payment under review",
  APPROVED: "Payment approved",
  REJECTED: "Receipt rejected",
  EXPIRED: "Payment request expired",
};

const COLLECTION_METHOD_LABELS: Record<
  PreorderPaymentCollectionMethod,
  string
> = {
  TRANSFER_BEFORE_HANDOFF: "Bank transfer before handoff",
  PAY_AT_HANDOFF: "Pay at delivery or pickup",
};

export function paymentStatusLabel(status: PreorderPaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status];
}

export function paymentCollectionMethodLabel(
  method: PreorderPaymentCollectionMethod,
): string {
  return COLLECTION_METHOD_LABELS[method];
}

/** Adapts current nullable fields until the richer payment contract lands. */
export function toPreorderPaymentView(
  terms: PaymentTerms,
): PreorderPaymentView {
  const {
    totalAmount,
    depositPercentage,
    depositAmount,
    balanceAmount,
  } = terms;

  if (
    totalAmount === null ||
    depositPercentage === null ||
    depositAmount === null ||
    balanceAmount === null
  ) {
    return { kind: "none" };
  }

  if (depositPercentage === 100) {
    return {
      kind: "full_payment",
      currency: "NGN",
      totalAmount,
      firstPaymentAmount: depositAmount,
      firstPaymentPercentage: 100,
    };
  }

  return {
    kind: "commitment_fee",
    currency: "NGN",
    totalAmount,
    firstPaymentAmount: depositAmount,
    firstPaymentPercentage: depositPercentage,
    balanceAmount,
  };
}
