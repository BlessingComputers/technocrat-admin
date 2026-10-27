import type { PreorderPaymentRequest, PreorderPaymentSummary } from "../types/preorders";

export function canFulfilPayment(
  summary: PreorderPaymentSummary | null | undefined,
  history: PreorderPaymentRequest[] | undefined,
): boolean {
  if (!history || summary === undefined) return false;
  if (summary === null) return history.length === 0;
  if (!Number.isFinite(summary.amountDue) || summary.amountDue !== 0) return false;
  if (summary.firstPayment.status !== "APPROVED") return false;
  if (summary.plan === "COMMITMENT_FEE" && summary.balancePayment?.status !== "APPROVED") return false;
  return history.filter((request) => !request.isSuperseded).every((request) => request.status === "APPROVED");
}

export function approvedPaymentAmount(history: PreorderPaymentRequest[]): number {
  return history.reduce((total, request) => total + (request.status === "APPROVED" ? request.amount : 0), 0);
}

export function hasApprovedPayment(history: PreorderPaymentRequest[]): boolean {
  return history.some((request) => request.status === "APPROVED");
}
