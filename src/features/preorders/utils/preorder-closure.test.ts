import { describe, expect, it } from "vitest";
import type { PreorderPaymentRequest, PreorderPaymentSummary } from "../types/preorders";
import { approvedPaymentAmount, canFulfilPayment, hasApprovedPayment } from "./preorder-closure";

const first: PreorderPaymentRequest = {
  id: "first", preorderId: "preorder", stage: "FIRST_PAYMENT", status: "APPROVED",
  collectionMethod: "TRANSFER_BEFORE_HANDOFF", amount: 30_000, percentage: 30,
  payBy: null, bankAccountSnapshot: null, rejectionReason: null,
  createdAt: "2026-09-07T10:00:00Z", updatedAt: "2026-09-07T10:00:00Z", evidence: [],
};
const balance: PreorderPaymentRequest = { ...first, id: "balance", stage: "BALANCE", amount: 70_000, percentage: 70 };
const summary: PreorderPaymentSummary = {
  plan: "COMMITMENT_FEE", currency: "NGN", totalAmount: 100_000,
  amountPaid: 100_000, amountDue: 0, isFullyPaid: true,
  firstPayment: first, balancePayment: balance,
};

describe("preorder fulfilment", () => {
  it("preserves verified legacy records and fails closed on missing payment data", () => {
    expect(canFulfilPayment(null, [])).toBe(true);
    expect(canFulfilPayment(undefined, [])).toBe(false);
    expect(canFulfilPayment(null, undefined)).toBe(false);
    expect(canFulfilPayment(null, [first])).toBe(false);
  });
  it("blocks the backend's premature fully-paid flag and a missing balance stage", () => {
    expect(canFulfilPayment({ ...summary, amountDue: 70_000, balancePayment: null }, [first])).toBe(false);
    expect(canFulfilPayment({ ...summary, balancePayment: null }, [first])).toBe(false);
  });
  it("requires all active stages to be approved", () => {
    for (const status of ["PENDING", "PROOF_SUBMITTED", "UNDER_REVIEW", "REJECTED", "EXPIRED"] satisfies PreorderPaymentRequest["status"][]) {
      const unpaid = { ...balance, status };
      expect(canFulfilPayment({ ...summary, balancePayment: unpaid }, [first, unpaid])).toBe(false);
    }
    expect(canFulfilPayment(summary, [first, balance])).toBe(true);
    expect(canFulfilPayment(summary, [first, balance, { ...first, id: "old", status: "EXPIRED", isSuperseded: true }])).toBe(true);
  });
  it("allows an approved full-payment plan without a balance", () => {
    expect(canFulfilPayment({ ...summary, plan: "FULL_PAYMENT", balancePayment: null }, [first])).toBe(true);
    expect(canFulfilPayment({ ...summary, amountDue: NaN }, [first, balance])).toBe(false);
  });
});

describe("paid cancellation", () => {
  it("requires a resolution after any approved payment, even an older request", () => {
    expect(hasApprovedPayment([{ ...first, isSuperseded: true }])).toBe(true);
    expect(hasApprovedPayment([{ ...first, status: "UNDER_REVIEW" }])).toBe(false);
    expect(approvedPaymentAmount([first, balance])).toBe(100_000);
    expect(approvedPaymentAmount([first, { ...balance, status: "PENDING" }])).toBe(30_000);
  });
});
