// Types for the parts pricing slice (markup rules). The backend leaves these
// response bodies untyped in the spec, so they're hand-written (mirroring the
// product pricing types) and read defensively in the UI. Parts rules add a
// `partTypeId` scope dimension and an `applyTo` of BOTH that product rules lack.

export type PartMarkupApplyTo = "PRICE" | "COMPARE_AT_PRICE" | "BOTH";

/**
 * Which half of the pricing system a rule belongs to. Computed server-side from
 * the sign of `markupPercentage`, which validation rejects at zero, so the two
 * values are exhaustive. Same field and same values as the product-side
 * `MarkupRuleType`; kept separate so the parts slice does not import from the
 * products slice.
 */
export type PartMarkupRuleType = "MARKUP" | "DISCOUNT";

/**
 * Percentage bounds. Mirrors the backend contract for `POST` part markup rules
 * (OpenAPI: signed value, "min 2% either way, max +500% / −99%"). A positive
 * value marks the price up; a negative value is a discount. The form takes a
 * positive magnitude plus a Markup/Discount toggle:
 *   markup   → [PART_MARKUP_MIN_PERCENT, PART_MARKUP_MAX_PERCENT]
 *   discount → [PART_MARKUP_MIN_PERCENT, PART_MARKUP_MAX_DISCOUNT_PERCENT], stored negative
 */
export const PART_MARKUP_MIN_PERCENT = 2;
export const PART_MARKUP_MAX_PERCENT = 500;
export const PART_MARKUP_MAX_DISCOUNT_PERCENT = 99;

interface Ref {
  id: string;
  name: string;
  slug: string;
}

/** A stored part markup rule. */
export interface PartMarkupRule {
  id: string; // DB UUID — what path params expect
  ruleId?: string; // human reference (e.g. MKP-XXXXXXXX), when present
  categoryId: string | null;
  brandId: string | null;
  partTypeId: string | null;
  /**
   * Exact-part scope. Set only on part-scoped rules, where
   * `categoryId`/`brandId`/`partTypeId` are null (the backend enforces the
   * either/or) and this rule outranks every taxonomy rule for that part.
   */
  partId: string | null;
  markupPercentage: number;
  /**
   * MARKUP or DISCOUNT, derived server-side from the sign of
   * `markupPercentage`.
   *
   * ONLY PRESENT ON READS. The list endpoint attaches it; create, update,
   * cancel and flash-sale responses do not (backend ask 25). Never test this
   * field on a value that came back from a write. Call `partRuleTypeOf`
   * instead, which falls back to the sign.
   */
  ruleType?: PartMarkupRuleType;
  applyTo: PartMarkupApplyTo;
  isActive: boolean;
  notes: string | null;
  category?: Ref | null;
  brand?: Ref | null;
  partType?: Ref | null;
  part?: Ref | null;
  createdAt?: string;
  updatedAt?: string;
  /**
   * Whether a coupon may be used on a cart containing a part this rule has
   * discounted. Defaults to `false` server-side, which rejects the coupon for
   * the *whole* cart, not just the discounted line. Ignored on a positive
   * (markup) rule. Optional here, like the rest of this hand-written shape,
   * because part rules are untyped in the OpenAPI spec.
   */
  allowCouponStacking?: boolean;
  /**
   * When a timed sale stops applying, or `null`/absent for one that runs until
   * it is cancelled. Ignored on a positive (markup) rule.
   *
   * A passed expiry does NOT flip `isActive` — the row still reads active until
   * the backend's five-minute sweep catches up, so treat this as the real
   * "is it still running" signal (see `markupRuleExpiry` in
   * `components/pricing/sale-timing.ts`).
   */
  expiresAt?: string | null;
  /** Present on PATCH responses when a change triggered a recompute. */
  partsRecomputed?: number;
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
export function partRuleTypeOf(rule: {
  ruleType?: PartMarkupRuleType;
  markupPercentage: number;
}): PartMarkupRuleType {
  return rule.ruleType ?? (rule.markupPercentage < 0 ? "DISCOUNT" : "MARKUP");
}

/**
 * A rule's target, as the form holds it before saving.
 *
 * EITHER an exact part OR a category/brand/part-type slice, mirroring the scope
 * the create endpoint accepts. `undefined` on a taxonomy axis is the wildcard
 * ("any"), which is a distinct target from a named one.
 */
export interface PartMarkupRuleTarget {
  partId?: string;
  categoryId?: string;
  brandId?: string;
  partTypeId?: string;
}

/**
 * Does this rule sit on exactly this target?
 *
 * Exact, not overlapping: a category-wide deal and a part markup inside that
 * category both stand, and the backend's duplicate-scope guard only refuses an
 * exact collision. So a "nothing here" answer means "nothing the server will
 * refuse", not "nothing that affects this price".
 */
export function isPartRuleAtTarget(
  rule: Pick<PartMarkupRule, "partId" | "categoryId" | "brandId" | "partTypeId">,
  target: PartMarkupRuleTarget,
): boolean {
  if (target.partId) return rule.partId === target.partId;
  if (rule.partId) return false;
  return (
    (rule.categoryId ?? null) === (target.categoryId ?? null) &&
    (rule.brandId ?? null) === (target.brandId ?? null) &&
    (rule.partTypeId ?? null) === (target.partTypeId ?? null)
  );
}

/**
 * Create payload. Scope is EITHER `partId` (one exact part) OR any combination
 * of `categoryId`/`brandId`/`partTypeId` — at least one, never both sides. The
 * backend rejects a mixed scope, since a part already implies its own category,
 * brand, and type.
 */
export interface PartMarkupRuleInput {
  categoryId?: string;
  brandId?: string;
  partTypeId?: string;
  partId?: string;
  markupPercentage: number;
  applyTo: PartMarkupApplyTo;
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

/** Partial update — only the included fields change (scope is fixed). */
export interface PartMarkupRuleUpdateInput {
  markupPercentage?: number;
  applyTo?: PartMarkupApplyTo;
  notes?: string;
  isActive?: boolean;
  allowCouponStacking?: boolean;
  /** Same trap as on create: omit it and a timed sale silently goes indefinite. */
  expiresAt?: string | null;
}

// ── Preview (dry-run) ──────────────────────────────────────────────────

export interface PartMarkupPreviewInput {
  ruleId?: string;
  categoryId?: string;
  brandId?: string;
  partTypeId?: string;
  /**
   * Exact-part scope for an ad-hoc dry run. Named `scopePartId` (not `partId`)
   * by the backend to keep it distinct from `partIds`, which *narrows* an
   * existing scope rather than defining one.
   */
  scopePartId?: string;
  markupPercentage?: number;
  applyTo?: PartMarkupApplyTo;
  partIds?: string[];
}

export interface PartMarkupPreviewRow {
  partId: string;
  name: string;
  partNumber?: string | null;
  currentPrice: number | null;
  projectedPrice: number | null;
  costPrice?: number | null;
  projectedMargin?: number;
}

export interface PartMarkupPreviewResult {
  totalParts: number;
  markupPercentage: number;
  applyTo: PartMarkupApplyTo;
  parts: PartMarkupPreviewRow[];
}

// ── Apply / reset ──────────────────────────────────────────────────────

export interface PartMarkupApplyInput {
  ruleId: string;
  partIds?: string[];
}

export interface PartMarkupApplyResult {
  updated: number;
  results?: unknown[];
}

/** Shared result of reset (keep active) / cancel (deactivate + reset). */
export interface PartMarkupResetResult {
  partsReset: number;
}
