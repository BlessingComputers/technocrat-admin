import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("formatMoney", () => {
  it("formats the amount in the caller's currency", () => {
    expect(formatMoney({ amount: 150_000, currency: "NGN" })).toBe("₦150,000");
    expect(formatMoney({ amount: 1500, currency: "USD" })).toBe("US$1,500");
  });
});
