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
   * Present on PATCH responses when a percentage/applyTo change triggered a
   * recompute — how many variant prices were rewritten from base.
   */
  variantsRecomputed?: number;
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
}

/** Partial update — only the included fields change. */
export interface MarkupRuleUpdateInput {
  markupPercentage?: number;
  applyTo?: MarkupApplyTo;
  notes?: string;
  isActive?: boolean;
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
