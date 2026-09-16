import type { components } from "@/types/api";

/**
 * The coupon row, generated from the spec.
 *
 * This was hand-authored until 2026-08-28. All three coupon routes used to
 * declare their success response as `content?: never`, so codegen produced
 * request types and nothing for the way back, and the shape had to be read off
 * `mapCouponToListItem` in the backend's `Admin.service.ts` — a copy that could
 * drift silently, which is exactly what codegen exists to prevent. Backend
 * `b2661a1` documented all four responses and added this component, so the copy
 * is gone.
 *
 * The generated shape carries one field the hand-written one could not:
 * **`startsAt`**, which the mapper now returns. It is also enforced at last —
 * see `NOT_ENFORCED` below for what that changed.
 *
 * Field notes worth keeping, since the generated type cannot carry them:
 *
 *   • `id` — internal UUID, what `PATCH`/`GET /admin/coupons/{id}` take.
 *   • `couponId` — human reference, `CPN-XXXXXXXX`. Ours, not the customer's.
 *   • `code` — what the customer types. Unique, `[A-Z0-9]{3,50}`, matched
 *     case-sensitively at checkout.
 *   • `description` — internal note, never shown to customers.
 *   • `discountValue` — a percent (0–100) for PERCENTAGE, an NGN amount for
 *     FIXED_AMOUNT.
 *   • `maxDiscountAmount` — NGN ceiling on a PERCENTAGE discount, ignored for
 *     FIXED_AMOUNT.
 *   • `usageCount` — never decremented; see `USAGE_IS_PERMANENT`.
 */
export type Coupon = components["schemas"]["AdminCouponListItem"];

export type DiscountType =
  components["schemas"]["AdminCreateCouponBody"]["discountType"];

export type CouponStatus = NonNullable<
  components["schemas"]["AdminCreateCouponBody"]["status"]
>;

/**
 * Render order for the filter chips, so it is a tuple rather than the bare
 * union — a union has no order and the chips must not reshuffle.
 *
 * ACTIVE first because it is the one that can cost money.
 */
export const COUPON_STATUSES = [
  "ACTIVE",
  "DISABLED",
  "EXPIRED",
] as const satisfies readonly CouponStatus[];

export const DISCOUNT_TYPES = [
  "PERCENTAGE",
  "FIXED_AMOUNT",
] as const satisfies readonly DiscountType[];

/**
 * Nothing, as of backend `b2661a1` (2026-08-28). Kept as a named, empty tuple
 * because the *reason* it is empty is the useful part, and because a future
 * write-only field belongs here rather than in a fresh convention.
 *
 * It used to hold two entries, and both are resolved — in opposite directions:
 *
 * `startsAt` — **now enforced.** `validateCouponForCart()` and `createOrder()`
 * both gained a `startsAt <= now` check, and the bank-transfer path applies the
 * same rule. A coupon dated to start next month is no longer redeemable today,
 * so a "Starts" control is a real scheduling promise now rather than a lie. It
 * is also returned, so an edit form finally has a current value to show.
 *
 * `applicable*Id` — **now gone.** Rather than start enforcing category/brand/
 * product scoping, the backend removed the three fields from the create and
 * update schemas outright. The columns still exist on `coupons` and old rows
 * may carry stale values, but nothing reads or writes them, and the API no
 * longer accepts them. There is consequently nothing for this UI to refuse to
 * expose. If per-category coupons are wanted, that is a new backend feature,
 * not a field we are declining to surface.
 */
export const NOT_ENFORCED = [] as const;

export interface CouponsListParams {
  page?: number;
  limit?: number;
  status?: CouponStatus;
  /** Matches code or description, case-insensitive `contains`. */
  search?: string;
  [key: string]: string | number | undefined;
}

/**
 * The list payload. A FLAT `total` — `{ data, total, page, limit, totalPages }`
 * — like pre-orders, not the `{ data, meta }` nesting the promotions and
 * customers lists use. Both come out of the same `PaginatedResponse<T>` helper.
 */
export interface CouponsPage {
  data: Coupon[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** `POST /admin/coupons`. Codegen'd — the request side IS documented. */
export type CreateCouponInput = components["schemas"]["AdminCreateCouponBody"];

/** `PATCH /admin/coupons/{id}`. Every field optional; at least one required. */
export type UpdateCouponInput = components["schemas"]["AdminUpdateCouponBody"];
