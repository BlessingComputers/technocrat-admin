import { describe, expect, it } from "vitest";
import { adSpendSchema, parseAmount, toAdSpendBody, type AdSpendFormValues } from "./ad-spend.schema";

const valid: AdSpendFormValues = {
  platform: "meta",
  campaign: "Black_Friday_2026",
  adContent: "",
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  amount: "₦250,000",
  note: "",
};

describe("parseAmount", () => {
  it("reads naira with commas and a symbol", () => {
    expect(parseAmount("₦250,000")).toBe(250_000);
    expect(parseAmount(" 1 500.50 ")).toBe(1500.5);
  });

  it("is NaN for junk", () => {
    expect(parseAmount("abc")).toBeNaN();
  });
});

describe("adSpendSchema", () => {
  it("accepts a typical entry", () => {
    expect(adSpendSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an end date before the start", () => {
    const result = adSpendSchema.safeParse({ ...valid, endDate: "2026-09-30" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["endDate"]);
  });

  it("rejects zero, negative and unreadable amounts", () => {
    for (const amount of ["0", "-5", "abc", ""]) {
      expect(adSpendSchema.safeParse({ ...valid, amount }).success).toBe(false);
    }
  });

  it("rejects an empty campaign", () => {
    expect(adSpendSchema.safeParse({ ...valid, campaign: "  " }).success).toBe(false);
  });
});

describe("toAdSpendBody", () => {
  it("sends numbers and nulls, not form strings", () => {
    expect(toAdSpendBody(valid)).toEqual({
      platform: "meta",
      campaign: "Black_Friday_2026",
      adContent: null,
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      amount: 250_000,
      note: null,
    });
  });
});
