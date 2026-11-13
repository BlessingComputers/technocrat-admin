import {
  ladderRows,
  type LadderRow,
  type LadderTier,
} from "@/lib/utils/markup-impact";
import type { CoverageRule } from "@/lib/utils/markup-coverage";
import {
  partRuleTypeOf,
  type PartMarkupApplyResult,
  type PartMarkupApplyTo,
  type PartMarkupCancelResult,
  type PartMarkupRule,
  type ReplacedPartMarkups,
} from "../../types/pricing";

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

// ── Tiers (ask 41) ─────────────────────────────────────────────────────

/** The backend's 9 resolver tiers for parts, strongest first. */
export type PartTier =
  | "part"
  | "categoryBrandType"
  | "categoryBrand"
  | "brandType"
  | "categoryType"
  | "brand"
  | "category"
  | "type"
  | "all";

export const PART_TIERS: readonly LadderTier<PartTier>[] = [
  { key: "part", label: "One part" },
  { key: "categoryBrandType", label: "Category, brand & type" },
  { key: "categoryBrand", label: "Category & brand" },
  { key: "brandType", label: "Brand & type" },
  { key: "categoryType", label: "Category & type" },
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "type", label: "Type" },
  { key: "all", label: "All parts" },
];

export const PART_TIER_LABEL = Object.fromEntries(
  PART_TIERS.map((t) => [t.key, t.label]),
) as Record<PartTier, string>;

interface ScopeFields {
  partId?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  partTypeId?: string | null;
}

/** Which resolver tier a scope falls in. */
export function tierOf({ partId, categoryId, brandId, partTypeId }: ScopeFields): PartTier {
  if (partId) return "part";
  const c = !!categoryId;
  const b = !!brandId;
  const t = !!partTypeId;
  if (c && b && t) return "categoryBrandType";
  if (c && b) return "categoryBrand";
  if (b && t) return "brandType";
  if (c && t) return "categoryType";
  if (b) return "brand";
  if (c) return "category";
  if (t) return "type";
  return "all";
}

/** The store-wide "All parts" rule: no part, category, brand or type. */
export const isAllScopeRule = (rule: ScopeFields): boolean => tierOf(rule) === "all";

/**
 * A "standing markup" in the backend's sense: positive and not made by a
 * deal. Only these turn off under `replaceExisting`.
 */
const isStandingMarkup = (rule: PartMarkupRule) =>
  rule.markupPercentage > 0 && !rule.dealId;

/**
 * The rules `replaceExisting` would turn off: every active standing part
 * markup except the all-parts rule itself (`selfId` when editing it).
 */
export function rulesToReplace(rules: PartMarkupRule[], selfId?: string): PartMarkupRule[] {
  return rules.filter(
    (r) => r.isActive && isStandingMarkup(r) && r.id !== selfId && !isAllScopeRule(r),
  );
}

/** "Where it sits" rows for a rule at `selfTier`. */
export function partLadder(
  rules: PartMarkupRule[],
  selfTier: PartTier,
  selfId: string | undefined,
  replace: boolean,
): LadderRow<PartTier>[] {
  const others = rules
    .filter((r) => r.isActive && isStandingMarkup(r) && r.id !== selfId)
    .map((r) => ({
      tier: tierOf(r),
      label: ruleScopeLabel(r),
      percentage: r.markupPercentage,
    }));
  return ladderRows(PART_TIERS, selfTier, others, replace);
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
  before: PartMarkupRule[],
): ReplacedRuleRow[] {
  const byRuleId = new Map(
    before.filter((r) => r.ruleId).map((r) => [r.ruleId as string, r]),
  );
  return rulesReplaced.map((ruleId) => {
    const rule = byRuleId.get(ruleId);
    return rule
      ? {
          ruleId,
          scope: ruleScopeLabel(rule),
          tier: PART_TIER_LABEL[tierOf(rule)],
          percentage: rule.markupPercentage,
        }
      : { ruleId, scope: ruleId, tier: "—", percentage: null };
  });
}

/** Toast text after a replace save. */
export function replaceSummary({
  rulesReplaced,
  partsRepriced,
  partsReset,
}: ReplacedPartMarkups): string {
  const off = rulesReplaced.length;
  const pieces = [
    `${off} markup${off === 1 ? "" : "s"} turned off`,
    `${parts(partsRepriced)} repriced`,
  ];
  if (partsReset > 0) pieces.push(`${parts(partsReset)} set to base price`);
  return `${pieces.join(", ")}.`;
}

export const APPLY_TO_LABEL: Record<PartMarkupApplyTo, string> = {
  PRICE: "Price",
  COMPARE_AT_PRICE: "Compare-at",
  BOTH: "Both",
};

/**
 * A rule in the coverage map's shape. Deals (negative rules) keep their deal
 * name in `notes` (the backend writes it there), so it becomes the meta line.
 */
export function toCoverageRule(rule: PartMarkupRule): CoverageRule {
  const isDeal = partRuleTypeOf(rule) === "DISCOUNT";
  return {
    id: rule.id,
    ruleId: rule.ruleId ?? "",
    label: ruleScopeLabel(rule),
    tier: tierOf(rule),
    categoryId: rule.categoryId,
    categoryName: rule.category?.name ?? null,
    brandId: rule.brandId,
    brandName: rule.brand?.name ?? null,
    typeId: rule.partTypeId,
    typeName: rule.partType?.name ?? null,
    itemId: rule.partId,
    pct: rule.markupPercentage,
    isDeal,
    dealId: rule.dealId ?? null,
    meta: isDeal ? (rule.notes ?? "Deal") : (APPLY_TO_LABEL[rule.applyTo] ?? rule.applyTo),
    expiresAt: rule.expiresAt ?? null,
    isActive: rule.isActive,
    createdAt: rule.createdAt ?? null,
  };
}

const parts = (n: number) => `${n} part${n === 1 ? "" : "s"}`;

/**
 * Toast text for a cancel. Cancel moves each part to its next matching rule,
 * or to base when none matches, so it reports both counts.
 */
export function cancelSummary({ partsReset, partsRepriced }: PartMarkupCancelResult): string {
  const moved = partsRepriced > 0 ? `${parts(partsRepriced)} moved to their next rule` : "";
  const based = partsReset > 0 ? `${parts(partsReset)} set to base price` : "";
  const pieces = [moved, based].filter(Boolean);
  return pieces.length ? `${pieces.join(", ")}.` : "no prices changed.";
}

/** Toast text for a reset (keep active). */
export const resetSummary = (partsReset: number): string =>
  `${parts(partsReset)} set to base price.`;

/** Toast text for an apply, with the parts another rule kept. */
export function applySummary({ updated, skippedByOtherRule }: PartMarkupApplyResult): string {
  const kept = skippedByOtherRule > 0
    ? ` ${parts(skippedByOtherRule)} kept by a more specific rule.`
    : "";
  return `Markup applied to ${parts(updated)}.${kept}`;
}
