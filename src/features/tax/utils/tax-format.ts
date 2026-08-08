import type { AnyTaxRule, PartTaxRule, TaxRule } from "../types/tax";

/**
 * Coerce a scoped-rule rate to a number. The backend serialises the Prisma
 * Decimal as a string (e.g. "7.50"); the global setting rate is already a
 * number. This handles both.
 */
export function rateToNumber(rate: number | string): number {
  const n = typeof rate === "number" ? rate : Number(rate);
  return Number.isFinite(n) ? n : 0;
}

/** Format a rate as a trimmed percentage, e.g. 7.5 → "7.5%", 7.0 → "7%". */
export function formatRate(rate: number | string): string {
  return `${+rateToNumber(rate).toFixed(2)}%`;
}

/**
 * Short date label, e.g. "5 Jul 2026". Local to the feature because the app's
 * `formatDate` currently lives inside features/customers, which the boundary
 * rules forbid importing here.
 */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Human scope label for a product tax rule: "Apple · Laptops",
 * "All brands · Laptops", or "Apple · All categories". An exact-product rule
 * (rare — created via API) shows the product name.
 */
export function productScopeLabel(rule: TaxRule): string {
  if (rule.product) return rule.product.name;
  const brand = rule.brand?.name ?? "All brands";
  const category = rule.category?.name ?? "All categories";
  return `${brand} · ${category}`;
}

/**
 * Human scope label for a part tax rule. Joins whichever of brand / category /
 * part-type are set; an exact-part rule shows the part name.
 */
export function partScopeLabel(rule: PartTaxRule): string {
  if (rule.part) return rule.part.name;
  const segments = [
    rule.brand?.name,
    rule.category?.name,
    rule.partTypeRef?.name,
  ].filter(Boolean);
  return segments.length ? segments.join(" · ") : "All parts";
}

/** Scope label for either rule kind. */
export function scopeLabel(rule: AnyTaxRule, kind: "product" | "part"): string {
  return kind === "part"
    ? partScopeLabel(rule as PartTaxRule)
    : productScopeLabel(rule as TaxRule);
}
