import { z } from "zod";
import {
  PART_MARKUP_MAX_DISCOUNT_PERCENT,
  PART_MARKUP_MAX_PERCENT,
  PART_MARKUP_MIN_PERCENT,
} from "../types/pricing";

/**
 * Part markup-rule form input (Zod owns inputs; responses are hand-typed). The
 * percentage is a signed number: positive marks up, negative discounts. The UI
 * builds it from a positive magnitude + a Markup/Discount toggle, so a valid
 * value lies in either the markup band [PART_MARKUP_MIN_PERCENT, 500] or the
 * discount band [-PART_MARKUP_MAX_DISCOUNT_PERCENT, -1].
 *
 * Scope is EITHER one exact part (`partId`) OR a category/brand/part-type slice
 * — at least one must be set, and the two sides are mutually exclusive because a
 * part already implies its own category, brand, and type (mirrors the backend's
 * `createPartMarkupRuleSchema` refines).
 */
export const partMarkupRuleFormSchema = z
  .object({
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    partTypeId: z.string().optional(),
    partId: z.string().optional(),
    markupPercentage: z
      .number({ message: "Enter a percentage" })
      .min(
        -PART_MARKUP_MAX_DISCOUNT_PERCENT,
        `Maximum discount is ${PART_MARKUP_MAX_DISCOUNT_PERCENT}%`,
      )
      .max(PART_MARKUP_MAX_PERCENT, `Maximum markup is ${PART_MARKUP_MAX_PERCENT}%`)
      .refine(
        (v) =>
          (v >= PART_MARKUP_MIN_PERCENT && v <= PART_MARKUP_MAX_PERCENT) ||
          (v <= -PART_MARKUP_MIN_PERCENT && v >= -PART_MARKUP_MAX_DISCOUNT_PERCENT),
        `Markup must be at least ${PART_MARKUP_MIN_PERCENT}%, or a discount of ${PART_MARKUP_MIN_PERCENT}–${PART_MARKUP_MAX_DISCOUNT_PERCENT}%`,
      ),
    applyTo: z.enum(["PRICE", "COMPARE_AT_PRICE", "BOTH"]),
    notes: z.string().max(500).optional().or(z.literal("")),
    isActive: z.boolean(),
  })
  .refine(
    (v) => !!(v.partId || v.categoryId || v.brandId || v.partTypeId),
    {
      message: "Pick a part, or at least one of category, brand, or part type",
      path: ["partId"],
    },
  )
  .refine(
    (v) => !(v.partId && (v.categoryId || v.brandId || v.partTypeId)),
    {
      message:
        "A part rule stands alone — it can’t also carry a category, brand, or part type",
      path: ["partId"],
    },
  );

export type PartMarkupRuleFormValues = z.infer<typeof partMarkupRuleFormSchema>;

export const EMPTY_MARKUP_RULE: PartMarkupRuleFormValues = {
  categoryId: "",
  brandId: "",
  partTypeId: "",
  partId: "",
  markupPercentage: 20,
  applyTo: "PRICE",
  notes: "",
  isActive: true,
};
