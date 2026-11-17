import { z } from "zod";
import { MARKUP_MAX_PERCENT, MARKUP_MIN_PERCENT } from "../types/pricing";

/**
 * Markup rule form input (ADR-0006: Zod owns request/form inputs).
 *
 * A markup only: the percentage is positive, in [MARKUP_MIN_PERCENT,
 * MARKUP_MAX_PERCENT]. The negative half of the same backend row is a deal, and
 * it is created from `/pricing/deals` with its own schema — this form cannot
 * make one, and the Deals form cannot make a markup.
 *
 * `expiresAt` and `allowCouponStacking` went with it. Both are ignored
 * server-side on a positive rule, so a standing pricing policy has no use for
 * either.
 *
 * Scope is EITHER one exact product (`productId`) OR a category/brand slice,
 * and the two sides are mutually exclusive because a product already implies
 * its own category and brand (mirrors the backend's `createMarkupRuleSchema`
 * refines). No scope at all is the "All products" rule (ask 41), and only that
 * rule, while active, may send `replaceExisting`.
 */
export const markupRuleFormSchema = z
  .object({
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    productId: z.string().optional(),
    markupPercentage: z
      .number({ message: "Enter a percentage" })
      .min(MARKUP_MIN_PERCENT, `Minimum markup is ${MARKUP_MIN_PERCENT}%`)
      .max(MARKUP_MAX_PERCENT, `Maximum markup is ${MARKUP_MAX_PERCENT}%`),
    applyTo: z.string().min(1, "Select what to apply the markup to"),
    notes: z.string().max(500, "Notes are too long").optional(),
    isActive: z.boolean(),
    replaceExisting: z.boolean().optional(),
  })
  .refine((v) => !(v.productId && (v.categoryId || v.brandId)), {
    message:
      "A product rule stands alone — it can’t also carry a category or brand",
    path: ["productId"],
  })
  .refine(
    (v) =>
      !v.replaceExisting ||
      (!v.productId && !v.categoryId && !v.brandId && v.isActive),
    {
      message:
        "Only an active “All products” rule can turn off the other markups",
      path: ["replaceExisting"],
    },
  );

export type MarkupRuleFormValues = z.infer<typeof markupRuleFormSchema>;
