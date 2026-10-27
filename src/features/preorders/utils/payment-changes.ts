import type { PreorderPaymentRequest } from "../types/preorders";

export function canRevisePayment(request: PreorderPaymentRequest) {
  return request.stage === "FIRST_PAYMENT" && !request.isSuperseded &&
    request.status === "PENDING" && request.evidence?.length === 0;
}

export function canExtendPayment(request: PreorderPaymentRequest) {
  return !request.isSuperseded && request.collectionMethod === "TRANSFER_BEFORE_HANDOFF" &&
    ["PENDING", "PROOF_SUBMITTED", "UNDER_REVIEW", "EXPIRED"].includes(request.status);
}

export function validNewDeadline(value: string, current: string | null, now = Date.now()) {
  const next = new Date(`${value}:00+01:00`).getTime();
  return Number.isFinite(next) && next > now &&
    (current === null || next > new Date(current).getTime());
}
