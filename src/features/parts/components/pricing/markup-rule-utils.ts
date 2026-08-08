import type { PartMarkupApplyTo, PartMarkupRule } from "../../types/pricing";

/**
 * Human label for a rule's scope, e.g. "Laptops · HP · Battery" or "All parts".
 *
 * A part-scoped rule names the part on its own — it carries no taxonomy by
 * construction, and it outranks every taxonomy rule for that part.
 */
export function ruleScopeLabel(rule: PartMarkupRule): string {
  if (rule.partId) return rule.part?.name ?? "Specific part";
  const parts = [
    rule.category?.name,
    rule.brand?.name,
    rule.partType?.name,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "All parts";
}

export const APPLY_TO_LABEL: Record<PartMarkupApplyTo, string> = {
  PRICE: "Price",
  COMPARE_AT_PRICE: "Compare-at",
  BOTH: "Both",
};
