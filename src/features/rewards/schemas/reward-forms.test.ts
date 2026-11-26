import { describe, expect, it } from "vitest";
import {
  makeAdjustmentSchema,
  makePaidSchema,
  rateFormSchema,
  REWARD_RATE_MAX,
} from "./reward-forms";

const firstMessage = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? null : r.error?.issues[0]?.message;

describe("rateFormSchema", () => {
  it("accepts whole naira from 0 to the max", () => {
    expect(rateFormSchema.safeParse({ uploadRate: 0, updateRate: REWARD_RATE_MAX }).success).toBe(true);
  });
  it("rejects decimals, negatives and NaN", () => {
    expect(firstMessage(rateFormSchema.safeParse({ uploadRate: 1.5, updateRate: 50 }))).toBe("Use whole naira");
    expect(firstMessage(rateFormSchema.safeParse({ uploadRate: -1, updateRate: 50 }))).toBe("A rate can't be negative");
    expect(firstMessage(rateFormSchema.safeParse({ uploadRate: Number.NaN, updateRate: 50 }))).toBe("Enter a rate");
  });
  it("rejects a rate above the max", () => {
    expect(firstMessage(rateFormSchema.safeParse({ uploadRate: REWARD_RATE_MAX + 1, updateRate: 50 }))).toBe(
      "A rate can't be more than ₦100,000",
    );
  });
});

describe("makeAdjustmentSchema", () => {
  const schema = makeAdjustmentSchema(5650);

  it("accepts a signed whole amount with a reason", () => {
    expect(schema.safeParse({ adjustment: -200, reason: "Two duplicates" }).success).toBe(true);
  });
  it("allows a final amount of exactly ₦0", () => {
    expect(schema.safeParse({ adjustment: -5650, reason: "All removed" }).success).toBe(true);
  });
  it("blocks a final amount below ₦0", () => {
    expect(firstMessage(schema.safeParse({ adjustment: -5651, reason: "Too much" }))).toBe(
      "The final amount can't go below ₦0",
    );
  });
  it("requires a reason, ignoring spaces", () => {
    expect(firstMessage(schema.safeParse({ adjustment: 100, reason: "   " }))).toBe("Give a reason");
  });
  it("limits the reason to 500 characters", () => {
    expect(firstMessage(schema.safeParse({ adjustment: 100, reason: "x".repeat(501) }))).toBe(
      "Keep the reason under 500 characters",
    );
  });
  it("rejects NaN and decimals", () => {
    expect(firstMessage(schema.safeParse({ adjustment: Number.NaN, reason: "r" }))).toBe("Enter an amount");
    expect(firstMessage(schema.safeParse({ adjustment: 1.5, reason: "r" }))).toBe("Use whole naira");
  });
});

describe("makePaidSchema", () => {
  const schema = makePaidSchema("2026-12-03");

  it("accepts today and earlier, with an optional note", () => {
    expect(schema.safeParse({ paidAt: "2026-12-03" }).success).toBe(true);
    expect(schema.safeParse({ paidAt: "2026-12-01", note: "Bank transfer" }).success).toBe(true);
  });
  it("rejects a future date", () => {
    expect(firstMessage(schema.safeParse({ paidAt: "2026-12-04" }))).toBe("The paid date can't be in the future");
  });
  it("rejects an empty date", () => {
    expect(firstMessage(schema.safeParse({ paidAt: "" }))).toBe("Pick a date");
  });
});
