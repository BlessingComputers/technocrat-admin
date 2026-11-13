import { z } from "zod";
import {
  PART_MARKUP_MAX_PERCENT,
  PART_MARKUP_MIN_PERCENT,
} from "../types/pricing";

/**
 * Part markup-rule form input (Zod owns inputs; responses are hand-typed).
 *
 * A markup only: the percentage is positive, in [PART_MARKUP_MIN_PERCENT,
 * PART_MARKUP_MAX_PERCENT]. The negative half of the same backend row is a
 * deal, and it is created from `/pricing/deals` with its own schema — this form
 * cannot make one, and the Deals form cannot make a markup.
 *
 * `expiresAt` and `allowCouponStacking` went with it. Both are ignored
 * server-side on a positive rule, so a standing pricing policy has no use for
 * either.
 *
 * Scope is EITHER one exact part (`partId`) OR a category/brand/part-type
 * slice, and the two sides are mutually exclusive because a part already
 * implies its own category, brand, and type (mirrors the backend's
 * `createPartMarkupRuleSchema` refines). No scope at all is the "All parts"
 * rule (ask 41), and only that rule, while active, may send `replaceExisting`.
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
        PART_MARKUP_MIN_PERCENT,
        `Minimum markup is ${PART_MARKUP_MIN_PERCENT}%`,
      )
      .max(
        PART_MARKUP_MAX_PERCENT,
        `Maximum markup is ${PART_MARKUP_MAX_PERCENT}%`,
      ),
    applyTo: z.enum(["PRICE", "COMPARE_AT_PRICE", "BOTH"]),
    notes: z.string().max(500).optional().or(z.literal("")),
    isActive: z.boolean(),
    replaceExisting: z.boolean().optional(),
  })
  .refine(
    (v) =>
      !v.replaceExisting ||
      (!v.partId && !v.categoryId && !v.brandId && !v.partTypeId && v.isActive),
    {
      message: "Only an active “All parts” rule can turn off the other markups",
      path: ["replaceExisting"],
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
