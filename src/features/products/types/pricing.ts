// Types for the products pricing slice (markup rules).
//
// TODO(codegen, ADR-0006): alias these response shapes to the generated OpenAPI
// schemas once they land; Zod owns the request/form inputs (see
// schemas/markup-rule-form.ts).

/**
 * What a rule's percentage is applied to. The backend only documents "PRICE"
 * today; the loose union keeps autocomplete on the known value while tolerating
 * any future server-side additions without a type break.
 */
export type MarkupApplyTo = "PRICE" | (string & {});

/**
 * Which half of the pricing system a rule belongs to. Computed server-side from
 * the sign of `markupPercentage`, which validation rejects at zero, so the two
 * values are exhaustive.
 *
 * The Markup screen and the Deals screen are the same rows split on this field.
 */
export type MarkupRuleType = "MARKUP" | "DISCOUNT";

/**
 * Percentage bounds. A positive value marks the price up; a negative value is a
 * discount (the backend accepts negatives). The form takes a positive magnitude
 * plus a Markup/Discount toggle, so these express each direction's magnitude:
 *   markup   → [MARKUP_MIN_PERCENT, MARKUP_MAX_PERCENT]
 *   discount → [1, MARKUP_MAX_DISCOUNT_PERCENT] stored as a negative number
 */
export const MARKUP_MIN_PERCENT = 2;
export const MARKUP_MAX_PERCENT = 500;
export const MARKUP_MAX_DISCOUNT_PERCENT = 90;

/** A stored markup rule, as returned by the list/detail endpoints. */
export interface MarkupRule {
  id: string; // DB UUID — the value path params expect
  ruleId: string; // human reference, e.g. MKP-XXXXXXXX
  categoryId: string | null;
  brandId: string | null;
  /**
   * Exact-product scope. Set only on product-scoped rules, where
   * `categoryId`/`brandId` are null (the backend enforces the either/or) and
   * this rule outranks every category/brand rule for that product.
   */
  productId: string | null;
  markupPercentage: number;
  /**
   * MARKUP or DISCOUNT, derived server-side from the sign of
   * `markupPercentage`.
   *
   * ONLY PRESENT ON READS. The list and detail endpoints attach it; create,
   * update, cancel and flash-sale responses do not, even though the OpenAPI
   * schema marks it required (backend ask 25). Never test this field on a value
   * that came back from a write — call `ruleTypeOf` instead, which falls back to
   * the sign. Feeding a create response straight into a list keyed on
   * `ruleType` makes the new rule vanish from the list it was just created in.
   */
  ruleType?: MarkupRuleType;
  applyTo: MarkupApplyTo;
  isActive: boolean;
  notes: string | null;
  createdByStaffId: string;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
  product: { id: string; name: string; slug: string } | null;
  createdBy: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Whether a coupon may be used on a cart containing an item this rule has
   * discounted. Defaults to `false` server-side, which rejects the coupon for
   * the *whole* cart, not just the discounted line. Ignored on a positive
   * (markup) rule.
   */
  allowCouponStacking: boolean;
  /**
   * When a timed sale stops applying, or `null` for one that runs until it is
   * cancelled. Ignored on a positive (markup) rule.
   *
   * A passed expiry does NOT flip `isActive` — the row still reads active until
   * the backend's five-minute sweep catches up, so treat this as the real
   * "is it still running" signal (see `markupRuleExpiry` in
   * `components/pricing/sale-timing.ts`).
   */
  expiresAt: string | null;
  /**
   * Present on PATCH responses when a percentage/applyTo change triggered a
   * recompute — how many variant prices were rewritten from base.
   */
  variantsRecomputed?: number;
}

/**
 * Which half a rule belongs to, safe on a value from any endpoint.
 *
 * Reads `ruleType` when the server sent it and falls back to the sign of
 * `markupPercentage` when it did not. The fallback is unreachable on `dev`
 * (`bbd0081` attaches `ruleType` to the write responses too) and load-bearing
 * on prod, whose `main` predates the whole field. Use this everywhere rather
 * than reaching for `rule.ruleType`.
 */
export function ruleTypeOf(rule: {
  ruleType?: MarkupRuleType;
  markupPercentage: number;
}): MarkupRuleType {
  return rule.ruleType ?? (rule.markupPercentage < 0 ? "DISCOUNT" : "MARKUP");
}

/**
 * A rule's target, as the form holds it before saving.
 *
 * EITHER an exact product OR a category/brand slice, mirroring the scope the
 * create endpoint accepts. `undefined` on a taxonomy axis is the wildcard
 * ("all categories" / "all brands"), which is a distinct target from a named
 * one.
 */
export interface MarkupRuleTarget {
  productId?: string;
  categoryId?: string;
  brandId?: string;
}

/**
 * Does this rule sit on exactly this target?
 *
 * Exact, not overlapping: a category-wide deal and a product markup inside that
 * category both stand, and the backend's duplicate-scope guard only refuses an
 * exact collision. So a "nothing here" answer means "nothing the server will
 * refuse", not "nothing that affects this price".
 */
export function isRuleAtTarget(
  rule: Pick<MarkupRule, "productId" | "categoryId" | "brandId">,
  target: MarkupRuleTarget,
): boolean {
  if (target.productId) return rule.productId === target.productId;
  if (rule.productId) return false;
  return (
    (rule.categoryId ?? null) === (target.categoryId ?? null) &&
    (rule.brandId ?? null) === (target.brandId ?? null)
  );
}

/**
 * Create payload. Scope is EITHER `productId` (exact product) OR any
 * combination of `categoryId`/`brandId` — at least one, never both sides. The
 * backend rejects a mixed scope, since a product already implies its own
 * category and brand.
 */
export interface MarkupRuleInput {
  categoryId?: string;
  brandId?: string;
  productId?: string;
  markupPercentage: number;
  applyTo: MarkupApplyTo;
  notes?: string;
  isActive?: boolean;
  allowCouponStacking?: boolean;
  /**
   * ISO timestamp, or `null` for no expiry. The backend rejects a value in the
   * past, and writes `dto.expiresAt ?? null` — so omitting it clears an expiry
   * that was already set. Always send it; never send an elapsed one back.
   */
  expiresAt?: string | null;
}

/** Partial update — only the included fields change. */
export interface MarkupRuleUpdateInput {
  markupPercentage?: number;
  applyTo?: MarkupApplyTo;
  notes?: string;
  isActive?: boolean;
  allowCouponStacking?: boolean;
  /** Same trap as on create: omit it and a timed sale silently goes indefinite. */
  expiresAt?: string | null;
}

// ── Preview (dry-run) ──────────────────────────────────────────────────

/**
 * Preview request. Two modes:
 *  - Saved rule: pass `ruleId`.
 *  - Ad-hoc: pass `markupPercentage` with `categoryId` and/or `brandId`.
 * `productIds`/`variantIds` optionally narrow either mode to a subset.
 */
export interface MarkupPreviewInput {
  ruleId?: string;
  categoryId?: string;
  brandId?: string;
  /**
   * Exact-product scope for an ad-hoc dry run. Named `scopeProductId` (not
   * `productId`) by the backend to keep it distinct from `productIds`, which
   * *narrows* an existing scope rather than defining one.
   */
  scopeProductId?: string;
  markupPercentage?: number;
  applyTo?: MarkupApplyTo;
  productIds?: string[];
  variantIds?: string[];
}

export interface MarkupPreviewVariant {
  variantId: string;
  variantName: string;
  sku: string;
  productId: string;
  productName: string;
  currentPrice: number;
  projectedPrice: number;
  currentCompareAtPrice: number | null;
  projectedCompareAtPrice: number | null;
  costPrice: number;
  projectedMargin: number;
}

export interface MarkupPreviewResult {
  totalVariants: number;
  totalProducts: number;
  markupPercentage: number;
  applyTo: MarkupApplyTo;
  variants: MarkupPreviewVariant[];
}

// ── Apply (writes prices) ──────────────────────────────────────────────

/** Apply a saved rule, optionally narrowed to specific products/variants. */
export interface MarkupApplyInput {
  ruleId: string;
  productIds?: string[];
  variantIds?: string[];
}

export interface MarkupApplyResultRow {
  variantId: string;
  sku: string;
  previousPrice: number;
  newPrice: number;
  margin: number;
}

export interface MarkupApplyResult {
  updated: number;
  results: MarkupApplyResultRow[];
}

// ── Reset (cancel / reset-keep-active / reset-category) ────────────────

/**
 * Shared result of any reset operation — cancel (deactivate + reset), reset
 * (keep active), or category reset: how many variants/parts were reset to base.
 */
export interface MarkupResetResult {
  variantsReset: number;
  partsReset: number;
}

/**
 * Reset every price in a category (and optionally one brand) to base, with no
 * rule required. At least one of categoryId / brandId must be set — passing
 * only brandId resets a brand across categories (the brand-only-rule case).
 */
export interface ResetCategoryInput {
  categoryId?: string;
  brandId?: string;
}
