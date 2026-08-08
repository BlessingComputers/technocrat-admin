import { z } from "zod";
import { TAX_RATE_MAX, TAX_RATE_MIN } from "../types/tax";

/**
 * Store-wide tax setting form (ADR-0006: Zod owns form/request inputs). Rate is
 * a percentage, 0–100, at most 2 decimals — matching the backend Decimal(5,2).
 */
export const taxSettingFormSchema = z.object({
  enabled: z.boolean(),
  rate: z
    .number({ message: "Enter a tax rate" })
    .min(TAX_RATE_MIN, "Rate can’t be negative")
    .max(TAX_RATE_MAX, `Rate can’t exceed ${TAX_RATE_MAX}%`)
    .refine(
      (v) => Math.round(v * 100) === v * 100,
      "Rate supports at most 2 decimal places",
    ),
});

export type TaxSettingFormValues = z.infer<typeof taxSettingFormSchema>;
