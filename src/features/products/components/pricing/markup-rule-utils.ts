import type { MarkupRule } from "../../types/pricing";

/**
 * Human label for a rule's scope.
 *
 * A product-scoped rule names the product on its own — it carries no category
 * or brand by construction, and it outranks every taxonomy rule for that
 * product. Otherwise the label reads "<brand> · <category>", e.g.
 * "Apple · Laptops", "All brands · Laptops", "Apple · All categories", where a
 * `null` on either axis is a wildcard.
 */
export function ruleScopeLabel(rule: MarkupRule): string {
  if (rule.productId) return rule.product?.name ?? "Specific product";
  const brand = rule.brand?.name ?? "All brands";
  const category = rule.category?.name ?? "All categories";
  return `${brand} · ${category}`;
}
