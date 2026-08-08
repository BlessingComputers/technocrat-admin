import { z } from "zod";
import { TAX_RATE_MAX, TAX_RATE_MIN } from "../types/tax";

/** Percentage rate, 0–100, ≤2dp — shared by product and part rule forms. */
const rateField = z
  .number({ message: "Enter a tax rate" })
  .min(TAX_RATE_MIN, "Rate can’t be negative")
  .max(TAX_RATE_MAX, `Rate can’t exceed ${TAX_RATE_MAX}%`)
  .refine(
    (v) => Math.round(v * 100) === v * 100,
    "Rate supports at most 2 decimal places",
  );

/**
 * Product tax-rule form. Scope is EITHER a specific product (exact-SKU override,
 * highest precedence) OR a category and/or brand — never both, mirroring the
 * backend refine: a product already implies its category/brand, so combining
 * them is redundant. At least one scope is required (an empty scope is just the
 * global rate).
 */
export const taxRuleFormSchema = z
  .object({
    productId: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    rate: rateField,
    notes: z.string().max(500, "Notes are too long").optional(),
    isActive: z.boolean(),
  })
  .refine(
    (v) => Boolean(v.productId) || Boolean(v.categoryId) || Boolean(v.brandId),
    {
      message: "Pick a product, or a category / brand",
      path: ["productId"],
    },
  )
  .refine((v) => !(v.productId && (v.categoryId || v.brandId)), {
    message: "A specific-product rule can’t also target a category or brand",
    path: ["productId"],
  });

export type TaxRuleFormValues = z.infer<typeof taxRuleFormSchema>;

/**
 * Part tax-rule form. Scope is EITHER a specific part (exact-part override,
 * highest precedence) OR any of category / brand / part-type — never both,
 * mirroring the product form and the backend refine.
 */
export const partTaxRuleFormSchema = z
  .object({
    partId: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    partTypeId: z.string().optional(),
    rate: rateField,
    notes: z.string().max(500, "Notes are too long").optional(),
    isActive: z.boolean(),
  })
  .refine(
    (v) =>
      Boolean(v.partId) ||
      Boolean(v.categoryId) ||
      Boolean(v.brandId) ||
      Boolean(v.partTypeId),
    {
      message: "Pick a part, or a category / brand / part type",
      path: ["partId"],
    },
  )
  .refine(
    (v) =>
      !(v.partId && (v.categoryId || v.brandId || v.partTypeId)),
    {
      message: "A specific-part rule can’t also target a category, brand, or type",
      path: ["partId"],
    },
  );

export type PartTaxRuleFormValues = z.infer<typeof partTaxRuleFormSchema>;
