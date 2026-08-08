// Types for the parts pricing slice (markup rules). The backend leaves these
// response bodies untyped in the spec, so they're hand-written (mirroring the
// product pricing types) and read defensively in the UI. Parts rules add a
// `partTypeId` scope dimension and an `applyTo` of BOTH that product rules lack.

export type PartMarkupApplyTo = "PRICE" | "COMPARE_AT_PRICE" | "BOTH";

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
  applyTo: PartMarkupApplyTo;
  isActive: boolean;
  notes: string | null;
  category?: Ref | null;
  brand?: Ref | null;
  partType?: Ref | null;
  part?: Ref | null;
  createdAt?: string;
  updatedAt?: string;
  /** Present on PATCH responses when a change triggered a recompute. */
  partsRecomputed?: number;
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
}

/** Partial update — only the included fields change (scope is fixed). */
export interface PartMarkupRuleUpdateInput {
  markupPercentage?: number;
  applyTo?: PartMarkupApplyTo;
  notes?: string;
  isActive?: boolean;
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
