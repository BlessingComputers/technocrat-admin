import type { PreorderPaymentSummary, PreorderStatus } from "../types/preorders";

export function canRequestBalance(status: PreorderStatus, summary: PreorderPaymentSummary) {
  return status === "CONFIRMED" && summary.plan === "COMMITMENT_FEE" &&
    summary.firstPayment.status === "APPROVED" && !summary.balancePayment &&
    summary.amountDue > 0;
}
