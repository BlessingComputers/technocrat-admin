import { describe, expect, it } from "vitest";
import { pickRefundPayment } from "./refund-payment";
import type { GatewayOrderPayment } from "../types/orders";

const row = (
  id: string,
  orderId: string,
  status: GatewayOrderPayment["status"],
): GatewayOrderPayment => ({ id, orderId, status });

describe("pickRefundPayment", () => {
  it("picks the paid payment over failed retries", () => {
    const rows = [
      row("p1", "o1", "FAILED"),
      row("p2", "o1", "PAID"),
      row("p3", "o1", "PENDING"),
    ];
    expect(pickRefundPayment(rows, "o1")?.id).toBe("p2");
  });

  it("ignores payments of other orders that the search also matched", () => {
    const rows = [row("p1", "o2", "PAID"), row("p2", "o1", "REFUNDED")];
    expect(pickRefundPayment(rows, "o1")?.id).toBe("p2");
  });

  it("returns null when nothing was paid", () => {
    expect(pickRefundPayment([row("p1", "o1", "FAILED")], "o1")).toBeNull();
  });
});
