import { describe, expect, it } from "vitest";
import type { PreorderPaymentRequest, PreorderPaymentSummary } from "../types/preorders";
import { canRequestBalance } from "./balance-payment";
import { mergePaymentHistory, mergePaymentSummaryRequest } from "./payment-history";

const first: PreorderPaymentRequest = {
  id: "first", preorderId: "preorder", stage: "FIRST_PAYMENT", status: "APPROVED",
  collectionMethod: "TRANSFER_BEFORE_HANDOFF", amount: 30_000, percentage: 30,
  payBy: null, bankAccountSnapshot: null, rejectionReason: null,
  createdAt: "2026-09-07T10:00:00Z", updatedAt: "2026-09-07T10:00:00Z", evidence: [],
};
const balance: PreorderPaymentRequest = { ...first, id: "balance", stage: "BALANCE", status: "PENDING", amount: 70_000, percentage: 70 };
const summary: PreorderPaymentSummary = {
  plan: "COMMITMENT_FEE", currency: "NGN", totalAmount: 100_000,
  amountPaid: 30_000, amountDue: 70_000, isFullyPaid: true,
  firstPayment: first, balancePayment: null,
};

describe("balance eligibility", () => {
  it("uses approved commitment fee and unpaid amount despite the backend fully-paid flag", () => {
    expect(canRequestBalance("CONFIRMED", summary)).toBe(true);
    expect(canRequestBalance("CONFIRMED", { ...summary, firstPayment: { ...first, status: "PENDING" } })).toBe(false);
    expect(canRequestBalance("CONFIRMED", { ...summary, plan: "FULL_PAYMENT" })).toBe(false);
    expect(canRequestBalance("CONFIRMED", { ...summary, balancePayment: balance })).toBe(false);
    expect(canRequestBalance("CONFIRMED", { ...summary, amountDue: 0 })).toBe(false);
    expect(canRequestBalance("CANCELLED", summary)).toBe(false);
    expect(canRequestBalance("FULFILLED", summary)).toBe(false);
  });
});

describe("balance review updates", () => {
  it("updates the balance without replacing the approved commitment fee", () => {
    const updated: PreorderPaymentRequest = { ...balance, status: "UNDER_REVIEW" };
    const result = mergePaymentSummaryRequest({ ...summary, balancePayment: balance }, updated);
    expect(result.firstPayment).toBe(first);
    expect(result.balancePayment?.status).toBe("UNDER_REVIEW");
    expect(result.amountPaid).toBe(30_000);
  });
  it("ignores a response for an old or unknown request", () => {
    expect(mergePaymentSummaryRequest(summary, { ...balance, id: "superseded" })).toBe(summary);
  });
  it("changes only the balance row in payment history", () => {
    const updated: PreorderPaymentRequest = { ...balance, status: "APPROVED" };
    const history = mergePaymentHistory([first, balance], updated);
    expect(history?.[0]).toBe(first);
    expect(history?.[1]?.status).toBe("APPROVED");
  });
});
