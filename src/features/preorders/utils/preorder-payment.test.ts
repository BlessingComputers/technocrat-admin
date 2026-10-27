import { describe, expect, it } from "vitest";
import {
  paymentCollectionMethodLabel,
  paymentStatusLabel,
  toPreorderPaymentView,
} from "./preorder-payment";

describe("preorder payment presentation", () => {
  it("does not render payment terms for a legacy preorder", () => {
    expect(
      toPreorderPaymentView({
        totalAmount: null,
        depositPercentage: null,
        depositAmount: null,
        balanceAmount: null,
      }),
    ).toEqual({ kind: "none" });
  });

  it("distinguishes commitment fees from full payment", () => {
    expect(
      toPreorderPaymentView({
        totalAmount: 400_000,
        depositPercentage: 25,
        depositAmount: 100_000,
        balanceAmount: 300_000,
      }).kind,
    ).toBe("commitment_fee");

    expect(
      toPreorderPaymentView({
        totalAmount: 400_000,
        depositPercentage: 100,
        depositAmount: 400_000,
        balanceAmount: 0,
      }).kind,
    ).toBe("full_payment");
  });

  it("uses the agreed soft wording for review and expiry", () => {
    expect(paymentStatusLabel("UNDER_REVIEW")).toBe("Payment under review");
    expect(paymentStatusLabel("EXPIRED")).toBe("Payment request expired");
  });

  it("distinguishes transfer from payment at handoff", () => {
    expect(paymentCollectionMethodLabel("TRANSFER_BEFORE_HANDOFF")).toBe(
      "Bank transfer before handoff",
    );
    expect(paymentCollectionMethodLabel("PAY_AT_HANDOFF")).toBe(
      "Pay at delivery or pickup",
    );
  });
});
