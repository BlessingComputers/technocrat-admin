import { describe, expect, it } from "vitest";
import { mergePaymentHistory, mergePaymentRequest } from "./payment-history";
import type { PreorderPaymentRequest } from "../types/preorders";

const request: PreorderPaymentRequest = {
  id: "request-1",
  preorderId: "preorder-1",
  stage: "FIRST_PAYMENT",
  collectionMethod: "TRANSFER_BEFORE_HANDOFF",
  status: "PROOF_SUBMITTED",
  percentage: 30,
  amount: 30_000,
  payBy: null,
  bankAccountSnapshot: null,
  rejectionReason: null,
  createdAt: "2026-09-07T10:00:00.000Z",
  updatedAt: "2026-09-07T10:00:00.000Z",
  evidence: [],
};

describe("mergePaymentHistory", () => {
  it("updates the matching request without dropping older evidence", () => {
    const oldEvidence = {
      id: "evidence-1",
      paymentRequestId: request.id,
      fileUrl: "https://example.com/old.png",
      transactionReference: "OLD",
      customerNote: null,
      submittedAt: "2026-09-07T11:00:00.000Z",
      decision: "REJECTED" as const,
      decisionReason: "Reference did not match",
      decidedAt: "2026-09-07T12:00:00.000Z",
    };
    const updated = {
      ...request,
      status: "UNDER_REVIEW" as const,
      evidence: [
        {
          ...oldEvidence,
          id: "evidence-2",
          transactionReference: "NEW",
          decision: "PENDING" as const,
        },
      ],
    };

    const result = mergePaymentHistory(
      [{ ...request, evidence: [oldEvidence] }],
      updated,
    );

    expect(result?.[0]?.status).toBe("UNDER_REVIEW");
    expect(result?.[0]?.evidence).toHaveLength(2);
  });

  it("keeps evidence when a status response omits the embed", () => {
    const current = {
      ...request,
      evidence: [
        {
          id: "evidence-1",
          paymentRequestId: request.id,
          fileUrl: "https://example.com/receipt.png",
          transactionReference: "TX-1",
          customerNote: null,
          submittedAt: "2026-09-07T11:00:00.000Z",
          decision: "PENDING" as const,
          decisionReason: null,
          decidedAt: null,
        },
      ],
    };

    const updated = { ...request, status: "UNDER_REVIEW" as const };
    expect(mergePaymentRequest(current, updated).evidence).toHaveLength(1);
  });
});
