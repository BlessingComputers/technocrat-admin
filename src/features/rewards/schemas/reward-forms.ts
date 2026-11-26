import { z } from "zod";

/** Matches the backend's `PUT /rate` bound (ask 20). */
export const REWARD_RATE_MAX = 100_000;

const rate = z
  .number({ message: "Enter a rate" })
  .int("Use whole naira")
  .min(0, "A rate can't be negative")
  .max(REWARD_RATE_MAX, "A rate can't be more than ₦100,000");

/** Rates tab (ADR-0006: Zod owns form inputs). Whole naira. */
export const rateFormSchema = z.object({
  uploadRate: rate,
  updateRate: rate,
});

/**
 * Adjust dialog. The final amount (computed + adjustment) can be ₦0 but never
 * less; the backend repeats this check (400 REWARD_NEGATIVE_TOTAL).
 */
export function makeAdjustmentSchema(computedAmount: number) {
  return z
    .object({
      adjustment: z.number({ message: "Enter an amount" }).int("Use whole naira"),
      reason: z
        .string()
        .trim()
        .min(1, "Give a reason")
        .max(500, "Keep the reason under 500 characters"),
    })
    .refine((v) => computedAmount + v.adjustment >= 0, {
      message: "The final amount can't go below ₦0",
      path: ["adjustment"],
    });
}

/** Mark paid dialog. `today` is `YYYY-MM-DD`, so string order is date order. */
export function makePaidSchema(today: string) {
  return z.object({
    paidAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
      .refine((d) => d <= today, "The paid date can't be in the future"),
    note: z.string().trim().max(500, "Keep the note under 500 characters").optional(),
  });
}
