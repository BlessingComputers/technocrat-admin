// Types for the deals slice.
//
// A deal is a named, schedulable group of markup rules that spans products AND
// parts in one row — which is why this is its own feature rather than a corner
// of `products` or `parts`. Nothing here is imported from either of those
// slices: features are siblings and may not reach into each other, so the small
// overlaps (the rule-type helper, the expiry helpers) are duplicated here on
// purpose, the same way the parts slice duplicates the products one.
//
// TODO(codegen, ADR-0006): alias these to the generated OpenAPI schemas
// (`components["schemas"]["Deal"]`) once the codegen aliasing lands.

/**
 * Where a deal is in its life.
 *
 * ```
 * DRAFT      no startsAt. No rules exist. Started by hand only.
 * SCHEDULED  a future startsAt. No rules yet. The sweep starts it.
 * ACTIVE     every target that took is a live rule.
 * ENDED      every rule reset to base. Terminal.
 * ```
 *
 * This UI only ever creates DRAFTs — a SCHEDULED deal cannot be edited,
 * cancelled or deleted before it fires (backend ask 28), so nothing staff can
 * create here should be unrecoverable. SCHEDULED still renders, because a deal
 * made outside this screen can be in it.
 */
export type DealStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "ENDED";

/** Which catalogue one target points at. */
export type DealEntityType = "product" | "part";

/** Discount magnitude bounds. Stored negative; the form takes the magnitude. */
export const DEAL_MIN_DISCOUNT_PERCENT = 1;
export const DEAL_MAX_DISCOUNT_PERCENT = 90;

/** A deal carries between one and this many targets. Enforced server-side too. */
export const DEAL_MAX_TARGETS = 100;

/**
 * One entry in a deal's `targets` array — a `POST /flash-sales` body tagged
 * with its catalogue.
 *
 * Scope is exclusive per entity type: a product target takes `productId` OR
 * `categoryId`/`brandId`; a part target takes `partId` OR
 * `categoryId`/`brandId`/`partTypeId`. `markupPercentage` is always negative.
 *
 * The array is stored as JSON on the deal row rather than as a join table,
 * because a DRAFT has no rules to read a scope off yet. So for a deal that has
 * not started, this is the *only* record of what it will cover.
 */
export interface DealTarget {
  entityType: DealEntityType;
  categoryId?: string;
  brandId?: string;
  productId?: string;
  partTypeId?: string;
  partId?: string;
  markupPercentage: number;
  notes?: string | null;
}

/** A stored deal, as the list and detail endpoints return it. */
export interface Deal {
  /** DB UUID — what every path param wants. */
  id: string;
  /** Human reference, `DEAL-XXXXXXXX`. Display only; never a path param. */
  dealId: string;
  /** Staff-written, and shown to customers via the public `/flash-sales` feed. */
  name: string;
  targets: DealTarget[];
  /** null = manual start only. Non-null = the five-minute sweep starts it. */
  startsAt: string | null;
  /**
   * Applied to every target rule once the deal starts, or null for one that
   * runs until it is ended by hand.
   *
   * A passed expiry does NOT flip `status` — the sweep runs every five minutes,
   * so an ACTIVE deal can honestly be over. Resolve it through `dealExpiry`
   * in `utils/deal-timing.ts` rather than trusting the status alone.
   */
  expiresAt: string | null;
  /**
   * Whether a coupon may be used on a cart containing anything this deal
   * discounts. `false` (the default) rejects the coupon for the WHOLE cart,
   * not just the discounted line.
   */
  allowCouponStacking: boolean;
  status: DealStatus;
  notes: string | null;
  createdByStaffId: string;
  /** Live product rules linked to this deal. 0 before it starts. */
  productRuleCount?: number;
  /** Live part rules linked to this deal. 0 before it starts. */
  partRuleCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * `GET /deals/{id}` — the deal plus whatever rules it has materialised.
 *
 * The spec documents no response body for this route (`content?: never`), so
 * this is hand-typed off the endpoint description. Treat both arrays as
 * possibly absent rather than assuming the shape.
 */
export interface DealDetail extends Deal {
  rules?: {
    products?: DealRuleRef[];
    parts?: DealRuleRef[];
  };
}

/** The slice of a materialised rule the detail page needs. */
export interface DealRuleRef {
  id: string;
  ruleId?: string;
  markupPercentage: number;
  isActive: boolean;
  productId?: string | null;
  partId?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  partTypeId?: string | null;
}

/** Create payload. No `startsAt`: this UI creates drafts only (see DealStatus). */
export interface CreateDealInput {
  name: string;
  /**
   * ISO timestamp, or omitted for a deal that runs until it is ended. The
   * backend rejects a value in the past.
   */
  expiresAt?: string;
  allowCouponStacking: boolean;
  notes?: string;
  targets: DealTarget[];
}

/**
 * One target's outcome from `POST /deals/{id}/start`.
 *
 * `index` points back into the deal's `targets` array. `error` is prose — the
 * blocking rule is named inside the sentence and there is no structured field
 * carrying its id, so render it verbatim and never parse it.
 */
export interface DealStartResult {
  index: number;
  entityType: DealEntityType;
  success: boolean;
  ruleId?: string;
  error?: string;
}

/**
 * The start response: the deal, plus per-target outcomes.
 *
 * A deal can come back ACTIVE with three of twelve targets never materialised —
 * most often on `MARKUP_RULE_SCOPE_CONFLICT`, where a markup rule already
 * occupies that exact scope. The failures always existed per rule; this is the
 * first response that makes them visible.
 *
 * `results` exists ONLY in this response. A refetch loses it, so the detail page
 * caches it under the deal's id and falls back to the count shortfall
 * (`targets.length` vs `productRuleCount + partRuleCount`) after a reload.
 */
export interface DealStartResponse extends Deal {
  results: DealStartResult[];
  targetsStarted: number;
  targetsFailed: number;
}

/** The end response: how many prices went back to base. */
export interface DealEndResponse extends Deal {
  variantsReset: number;
  partsReset: number;
}

// ── Clash lookup ───────────────────────────────────────────────────────

/**
 * Which half of the pricing system a markup rule belongs to.
 *
 * Duplicated from the products/parts slices rather than shared: features cannot
 * import each other, and this screen only reads rules to warn about clashes.
 */
export type MarkupRuleKind = "MARKUP" | "DISCOUNT";

/** The slice of a markup rule the target builder's clash check reads. */
export interface ClashRule {
  id: string;
  ruleId?: string;
  markupPercentage: number;
  ruleType?: MarkupRuleKind;
  isActive: boolean;
  notes: string | null;
  productId?: string | null;
  partId?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  partTypeId?: string | null;
}

/**
 * Markup or discount, safe on a value from any endpoint.
 *
 * Falls back to the sign when the server omits `ruleType`, which prod's `main`
 * does for every response — it predates the field entirely. Never read
 * `rule.ruleType` raw.
 */
export function markupKindOf(rule: {
  ruleType?: MarkupRuleKind;
  markupPercentage: number;
}): MarkupRuleKind {
  return rule.ruleType ?? (rule.markupPercentage < 0 ? "DISCOUNT" : "MARKUP");
}

/**
 * Does this rule sit on exactly the scope this target names?
 *
 * Exact, not overlapping — which is the same test the backend's duplicate-scope
 * guard applies. A category-wide markup and a product-level deal inside it both
 * stand, so a "nothing here" answer means "nothing the server will refuse", not
 * "nothing that affects this price".
 *
 * Inactive rules count, because the backend's lookup ignores `isActive` too: a
 * switched-off markup still occupies the scope.
 */
export function ruleSitsOnTarget(rule: ClashRule, target: DealTarget): boolean {
  if (target.entityType === "product") {
    if (target.productId) return rule.productId === target.productId;
    if (rule.productId) return false;
    return (
      (rule.categoryId ?? null) === (target.categoryId ?? null) &&
      (rule.brandId ?? null) === (target.brandId ?? null)
    );
  }
  if (target.partId) return rule.partId === target.partId;
  if (rule.partId) return false;
  return (
    (rule.categoryId ?? null) === (target.categoryId ?? null) &&
    (rule.brandId ?? null) === (target.brandId ?? null) &&
    (rule.partTypeId ?? null) === (target.partTypeId ?? null)
  );
}

/** True once a target names any scope at all. */
export function targetHasScope(target: DealTarget): boolean {
  return !!(
    target.productId ||
    target.partId ||
    target.categoryId ||
    target.brandId ||
    target.partTypeId
  );
}

/**
 * How many of a deal's targets became live rules.
 *
 * The two counts are the only durable record of a partial start — the `results`
 * array lives in the start response alone. They are optional on the wire, so a
 * server that omits them yields `null` ("we cannot say") rather than a
 * confident zero.
 */
export function startedTargetCount(deal: Deal): number | null {
  if (deal.productRuleCount === undefined && deal.partRuleCount === undefined) {
    return null;
  }
  return (deal.productRuleCount ?? 0) + (deal.partRuleCount ?? 0);
}

/**
 * Targets that never materialised, or null when the counts cannot answer.
 *
 * Only meaningful once a deal has left DRAFT/SCHEDULED — before that, zero
 * rules is the correct state, not a shortfall.
 */
export function failedTargetCount(deal: Deal): number | null {
  if (deal.status === "DRAFT" || deal.status === "SCHEDULED") return null;
  const started = startedTargetCount(deal);
  if (started === null) return null;
  const missing = deal.targets.length - started;
  return missing > 0 ? missing : 0;
}

/**
 * The single discount every target shares, or null when they differ.
 *
 * Returned as a positive magnitude — the stored percentages are negative.
 */
export function sharedDiscountMagnitude(targets: DealTarget[]): number | null {
  if (targets.length === 0) return null;
  const first = Math.abs(targets[0].markupPercentage);
  return targets.every((t) => Math.abs(t.markupPercentage) === first)
    ? first
    : null;
}
