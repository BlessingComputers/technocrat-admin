import { describe, expect, it } from "vitest";
import { canExtendPayment, canRevisePayment, validNewDeadline } from "./payment-changes";
import type { PreorderPaymentRequest } from "../types/preorders";

const request: PreorderPaymentRequest = {
  id: "request", preorderId: "preorder", stage: "FIRST_PAYMENT",
  collectionMethod: "TRANSFER_BEFORE_HANDOFF", status: "PENDING",
  amount: 30_000, percentage: 30, payBy: "2026-09-10T10:00:00Z",
  bankAccountSnapshot: null, rejectionReason: null,
  createdAt: "2026-09-07T10:00:00Z", updatedAt: "2026-09-07T10:00:00Z", evidence: [],
};

describe("payment revisions", () => {
  it("requires a pending first payment with known empty evidence history", () => {
    expect(canRevisePayment(request)).toBe(true);
    expect(canRevisePayment({ ...request, evidence: undefined })).toBe(false);
    expect(canRevisePayment({ ...request, stage: "BALANCE" })).toBe(false);
    expect(canRevisePayment({ ...request, isSuperseded: true })).toBe(false);
    for (const status of ["PROOF_SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "EXPIRED"] satisfies PreorderPaymentRequest["status"][]) {
      expect(canRevisePayment({ ...request, status })).toBe(false);
    }
  });
  it("locks a pending request if any evidence was previously submitted", () => {
    expect(canRevisePayment({ ...request, evidence: [{
      id: "receipt", paymentRequestId: request.id, fileUrl: "https://example.com/receipt.png",
      transactionReference: "TX1", customerNote: null, submittedAt: request.createdAt,
      decision: "REJECTED", decisionReason: "Wrong amount", decidedAt: request.updatedAt,
    }] })).toBe(false);
  });
});

describe("deadline extensions", () => {
  it("allows expired and under-review transfers but not completed or replaced requests", () => {
    for (const status of ["PENDING", "PROOF_SUBMITTED", "UNDER_REVIEW", "EXPIRED"] satisfies PreorderPaymentRequest["status"][]) {
      expect(canExtendPayment({ ...request, status })).toBe(true);
    }
    expect(canExtendPayment({ ...request, status: "APPROVED" })).toBe(false);
    expect(canExtendPayment({ ...request, status: "REJECTED" })).toBe(false);
    expect(canExtendPayment({ ...request, collectionMethod: "PAY_AT_HANDOFF" })).toBe(false);
    expect(canExtendPayment({ ...request, isSuperseded: true })).toBe(false);
  });
  it("uses WAT and rejects equal, shorter, invalid and past deadlines", () => {
    const now = Date.parse("2026-09-07T10:00:00Z");
    expect(validNewDeadline("2026-09-10T11:01", request.payBy, now)).toBe(true);
    expect(validNewDeadline("2026-09-10T11:00", request.payBy, now)).toBe(false);
    expect(validNewDeadline("2026-09-10T10:59", request.payBy, now)).toBe(false);
    expect(validNewDeadline("", request.payBy, now)).toBe(false);
    expect(validNewDeadline("2026-09-07T10:00", null, now)).toBe(false);
    expect(validNewDeadline("2026-09-07T11:01", "2026-09-06T10:00:00Z", now)).toBe(true);
  });
});
