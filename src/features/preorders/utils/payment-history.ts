import type { PreorderPaymentRequest, PreorderPaymentSummary } from "../types/preorders";

export function mergePaymentSummaryRequest(
  summary: PreorderPaymentSummary,
  updated: PreorderPaymentRequest,
): PreorderPaymentSummary {
  if (updated.id === summary.firstPayment.id) {
    return { ...summary, firstPayment: mergePaymentRequest(summary.firstPayment, updated) };
  }
  if (updated.id === summary.balancePayment?.id) {
    return { ...summary, balancePayment: mergePaymentRequest(summary.balancePayment, updated) };
  }
  return summary;
}

export function mergePaymentHistory(
  history: PreorderPaymentRequest[] | undefined,
  updated: PreorderPaymentRequest,
): PreorderPaymentRequest[] | undefined {
  if (!history) return history;

  return history.map((request) =>
    request.id === updated.id ? mergePaymentRequest(request, updated) : request,
  );
}

export function mergePaymentRequest(
  current: PreorderPaymentRequest,
  updated: PreorderPaymentRequest,
): PreorderPaymentRequest {
  const evidenceById = new Map(
    (current.evidence ?? []).map((evidence) => [evidence.id, evidence]),
  );
  for (const evidence of updated.evidence ?? []) {
    evidenceById.set(evidence.id, evidence);
  }

  return { ...current, ...updated, evidence: [...evidenceById.values()] };
}
