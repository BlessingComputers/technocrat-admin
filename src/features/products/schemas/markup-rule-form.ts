import { z } from "zod";
import {
  MARKUP_MAX_DISCOUNT_PERCENT,
  MARKUP_MAX_PERCENT,
  MARKUP_MIN_PERCENT,
} from "../types/pricing";

/**
 * Markup rule form input (ADR-0006: Zod owns request/form inputs). The
 * percentage is a signed number: positive marks up, negative discounts. The UI
 * builds it from a positive magnitude + a Markup/Discount toggle, so a valid
 * value lies in either the markup band [2, 500] or the discount band [-90, -1].
 * Scope is EITHER one exact product (`productId`) OR a category/brand slice —
 * at least one must be set so the rule targets something, and the two sides are
 * mutually exclusive because a product already implies its own category and
 * brand (mirrors the backend's `createMarkupRuleSchema` refines, and
 * `tax-rule-form.ts` on the tax side).
 */
export const markupRuleFormSchema = z
  .object({
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    productId: z.string().optional(),
    markupPercentage: z
      .number({ message: "Enter a percentage" })
      .min(-MARKUP_MAX_DISCOUNT_PERCENT, `Maximum discount is ${MARKUP_MAX_DISCOUNT_PERCENT}%`)
      .max(MARKUP_MAX_PERCENT, `Maximum markup is ${MARKUP_MAX_PERCENT}%`)
      .refine(
        (v) =>
          (v >= MARKUP_MIN_PERCENT && v <= MARKUP_MAX_PERCENT) ||
          (v <= -1 && v >= -MARKUP_MAX_DISCOUNT_PERCENT),
        `Markup must be at least ${MARKUP_MIN_PERCENT}%, or a discount of 1–${MARKUP_MAX_DISCOUNT_PERCENT}%`,
      ),
    applyTo: z.string().min(1, "Select what to apply the markup to"),
    notes: z.string().max(500, "Notes are too long").optional(),
    isActive: z.boolean(),
  })
  .refine(
    (v) => Boolean(v.productId) || Boolean(v.categoryId) || Boolean(v.brandId),
    {
      message: "Pick a product, or a category and/or brand",
      path: ["productId"],
    },
  )
  .refine((v) => !(v.productId && (v.categoryId || v.brandId)), {
    message:
      "A product rule stands alone — it can’t also carry a category or brand",
    path: ["productId"],
  });

export type MarkupRuleFormValues = z.infer<typeof markupRuleFormSchema>;
