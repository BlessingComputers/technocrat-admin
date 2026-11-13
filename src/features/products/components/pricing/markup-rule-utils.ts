import {
  ladderRows,
  type LadderRow,
  type LadderTier,
} from "@/lib/utils/markup-impact";
import type { CoverageRule } from "@/lib/utils/markup-coverage";
import {
  ruleTypeOf,
  type MarkupApplyResult,
  type MarkupCancelResult,
  type MarkupResetResult,
  type MarkupRule,
  type ReplacedProductMarkups,
} from "../../types/pricing";

/**
 * Human label for a rule's scope.
 *
 * A product-scoped rule names the product on its own — it carries no category
 * or brand by construction, and it outranks every taxonomy rule for that
 * product. A rule with no scope at all is "All products" (ask 41). Otherwise
 * the label reads "<brand> · <category>", e.g. "Apple · Laptops",
 * "All brands · Laptops", "Apple · All categories", where a `null` on either
 * axis is a wildcard.
 */
export function ruleScopeLabel(rule: MarkupRule): string {
  if (rule.productId) return rule.product?.name ?? "Specific product";
  if (!rule.categoryId && !rule.brandId) return "All products";
  const brand = rule.brand?.name ?? "All brands";
  const category = rule.category?.name ?? "All categories";
  return `${brand} · ${category}`;
}

// ── Tiers (ask 41) ─────────────────────────────────────────────────────

/** The backend's resolver tiers for products, strongest first. */
export type ProductTier = "product" | "categoryBrand" | "brand" | "category" | "all";

export const PRODUCT_TIERS: readonly LadderTier<ProductTier>[] = [
  { key: "product", label: "One product" },
  { key: "categoryBrand", label: "Category & brand" },
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "all", label: "All products" },
];

export const PRODUCT_TIER_LABEL = Object.fromEntries(
  PRODUCT_TIERS.map((t) => [t.key, t.label]),
) as Record<ProductTier, string>;

interface ScopeFields {
  productId?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
}

/** Which resolver tier a scope falls in. */
export function tierOf({ productId, categoryId, brandId }: ScopeFields): ProductTier {
  if (productId) return "product";
  if (categoryId && brandId) return "categoryBrand";
  if (brandId) return "brand";
  if (categoryId) return "category";
  return "all";
}

/** The store-wide "All products" rule: no product, category or brand. */
export const isAllScopeRule = (rule: ScopeFields): boolean => tierOf(rule) === "all";

/**
 * A "standing markup" in the backend's sense: positive and not made by a
 * deal. Only these turn off under `replaceExisting`.
 */
const isStandingMarkup = (rule: MarkupRule) =>
  rule.markupPercentage > 0 && !rule.dealId;

/**
 * The rules `replaceExisting` would turn off: every active standing markup
 * except the all-products rule itself (`selfId` when editing it).
 */
export function rulesToReplace(rules: MarkupRule[], selfId?: string): MarkupRule[] {
  return rules.filter(
    (r) => r.isActive && isStandingMarkup(r) && r.id !== selfId && !isAllScopeRule(r),
  );
}

/**
 * A shorter scope label for the ladder, which already names the tier: no
 * "All brands" / "All categories" filler.
 */
export function ladderScopeLabel(rule: MarkupRule): string {
  if (rule.productId) return rule.product?.name ?? "Specific product";
  const names = [rule.brand?.name, rule.category?.name].filter(Boolean);
  return names.length ? names.join(" · ") : "All products";
}

/** "Where it sits" rows for a rule at `selfTier`. */
export function productLadder(
  rules: MarkupRule[],
  selfTier: ProductTier,
  selfId: string | undefined,
  replace: boolean,
): LadderRow<ProductTier>[] {
  const others = rules
    .filter((r) => r.isActive && isStandingMarkup(r) && r.id !== selfId)
    .map((r) => ({
      tier: tierOf(r),
      label: ladderScopeLabel(r),
      percentage: r.markupPercentage,
    }));
  return ladderRows(PRODUCT_TIERS, selfTier, others, replace);
}

const APPLY_TO_LABEL: Record<string, string> = { PRICE: "Selling price" };

/**
 * A rule in the coverage map's shape. Deals (negative rules) keep their deal
 * name in `notes` (the backend writes it there), so it becomes the meta line.
 */
export function toCoverageRule(rule: MarkupRule): CoverageRule {
  const isDeal = ruleTypeOf(rule) === "DISCOUNT";
  return {
    id: rule.id,
    ruleId: rule.ruleId,
    label: ladderScopeLabel(rule),
    tier: tierOf(rule),
    categoryId: rule.categoryId,
    categoryName: rule.category?.name ?? null,
    brandId: rule.brandId,
    brandName: rule.brand?.name ?? null,
    typeId: null,
    typeName: null,
    itemId: rule.productId,
    // The list sends a Decimal as a string ("10"); the preview refuses one.
    pct: Number(rule.markupPercentage),
    affectsPrice: true,
    isDeal,
    dealId: rule.dealId ?? null,
    meta: isDeal ? (rule.notes ?? "Deal") : (APPLY_TO_LABEL[rule.applyTo] ?? rule.applyTo),
    expiresAt: rule.expiresAt,
    isActive: rule.isActive,
    createdAt: rule.createdAt,
  };
}

/** One row of the "Turned off" list after a replace save. */
export interface ReplacedRuleRow {
  ruleId: string;
  scope: string;
  tier: string;
  percentage: number | null;
}

/**
 * Match the `rulesReplaced` ids against the rules as they were before the
 * save (the list refetches straight after, with them inactive). An id the
 * snapshot does not know still gets a row, so the count stays honest.
 */
export function replacedRuleRows(
  rulesReplaced: string[],
  before: MarkupRule[],
): ReplacedRuleRow[] {
  const byRuleId = new Map(before.map((r) => [r.ruleId, r]));
  return rulesReplaced.map((ruleId) => {
    const rule = byRuleId.get(ruleId);
    return rule
      ? {
          ruleId,
          scope: ladderScopeLabel(rule),
          tier: PRODUCT_TIER_LABEL[tierOf(rule)],
          percentage: rule.markupPercentage,
        }
      : { ruleId, scope: ruleId, tier: "—", percentage: null };
  });
}

/** Toast text after a replace save. */
export function replaceSummary({
  rulesReplaced,
  variantsRepriced,
  variantsReset,
}: ReplacedProductMarkups): string {
  const off = rulesReplaced.length;
  const pieces = [
    `${off} markup${off === 1 ? "" : "s"} turned off`,
    `${variants(variantsRepriced)} repriced`,
  ];
  if (variantsReset > 0) pieces.push(`${variants(variantsReset)} set to base price`);
  return `${pieces.join(", ")}.`;
}

const variants = (n: number) => `${n} variant${n === 1 ? "" : "s"}`;

/**
 * Toast text for a cancel. Cancel moves each variant to its next matching
 * rule, or to base when none matches, so it reports both counts.
 */
export function cancelSummary({ variantsReset, variantsRepriced }: MarkupCancelResult): string {
  const moved = variantsRepriced > 0 ? `${variants(variantsRepriced)} moved to their next rule` : "";
  const based = variantsReset > 0 ? `${variants(variantsReset)} set to base price` : "";
  const pieces = [moved, based].filter(Boolean);
  return pieces.length ? `${pieces.join(", ")}.` : "no prices changed.";
}

/** Toast text for a reset. Parts show only when the backend reset some. */
export function resetSummary({ variantsReset, partsReset }: MarkupResetResult): string {
  const partText = partsReset > 0 ? ` and ${partsReset} part${partsReset === 1 ? "" : "s"}` : "";
  return `${variants(variantsReset)}${partText} set to base price.`;
}

/** Toast text for an apply, with the variants another rule kept. */
export function applySummary({ updated, skippedByOtherRule }: MarkupApplyResult): string {
  const kept = skippedByOtherRule > 0
    ? ` ${variants(skippedByOtherRule)} kept by a more specific rule.`
    : "";
  return `Applied — ${variants(updated)} repriced.${kept}`;
}
