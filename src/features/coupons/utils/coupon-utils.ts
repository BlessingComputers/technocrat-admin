/**
 * Presentation helpers for the coupons catalogue. Tone maps use semantic
 * tokens only (ADR-0009), and text on a tint uses the `-ink` role — see the
 * `-ink` note in `globals.css`. (`preorder-utils` and `customer-utils` still
 * carry the pre-`-ink` spelling, `text-success` on `bg-success/15`, which
 * measures 2.55:1. Don't copy from them.)
 */
import { formatPrice } from "@/lib/utils/format";
import type { Coupon, CouponStatus } from "../types/coupons";

type Tone = "success" | "warning" | "danger" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/15 text-success-ink border-success/25",
  warning: "bg-warning/15 text-warning-ink border-warning/25",
  danger: "bg-destructive/12 text-destructive-ink border-destructive/25",
  muted: "bg-muted text-muted-foreground border-border",
};

// ─────────────────────────────────────────────────────────────────────────────
// Effective state — what a customer typing the code would actually experience
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A coupon's stored `status` is not the whole truth, and on this screen the
 * difference is the whole point.
 *
 * All three redemption paths — `validateCouponForCart`, `createOrder` and (as
 * of backend `b2661a1`) the bank-transfer `checkout` — select on
 * `status: ACTIVE AND startsAt <= now AND (expiresAt IS NULL OR expiresAt >
 * now)`, then check the usage caps separately. A row can therefore sit at
 * `ACTIVE` and be rejected at the till for three separate reasons: it has not
 * started yet, it has passed its expiry, or its last redemption is spent.
 * Showing such a row as "Active" would be repeating the database back at
 * someone who asked about the shop.
 *
 * A background worker now flips expired rows to `EXPIRED` hourly, so the
 * expiry seam closes on its own within the hour — but only for expiry, and
 * only eventually, so the computation below still leads.
 *
 * This computes what the till would do. The chips still filter on the stored
 * status, because that is what the API accepts — the list view carries one
 * line of copy explaining the seam.
 */
export type CouponState =
  | "LIVE"
  | "SCHEDULED"
  | "EXPIRED"
  | "USED_UP"
  | "DISABLED";

export function couponState(coupon: Coupon, now: Date = new Date()): CouponState {
  if (coupon.status === "DISABLED") return "DISABLED";
  if (coupon.status === "EXPIRED") return "EXPIRED";
  if (isPastExpiry(coupon, now)) return "EXPIRED";
  // Before USED_UP: a coupon that has not opened cannot have been spent, so if
  // both somehow read true the schedule is the more useful thing to say.
  if (isNotYetStarted(coupon, now)) return "SCHEDULED";
  if (isUsedUp(coupon)) return "USED_UP";
  return "LIVE";
}

/**
 * Whether the coupon's start date is still ahead of us.
 *
 * `startsAt` defaults to the row's creation time, so this is false for every
 * coupon except one an admin deliberately dated forward. It became a real
 * state in backend `b2661a1` — before that the field was stored and never
 * read, and a coupon "starting" next month was redeemable the moment it was
 * created.
 */
export function isNotYetStarted(coupon: Coupon, now: Date = new Date()): boolean {
  const starts = new Date(coupon.startsAt).getTime();
  if (Number.isNaN(starts)) return false;
  // `startsAt <= now` on the backend, so a start exactly at `now` is open.
  return starts > now.getTime();
}

export function isPastExpiry(coupon: Coupon, now: Date = new Date()): boolean {
  if (!coupon.expiresAt) return false;
  const expiry = new Date(coupon.expiresAt).getTime();
  if (Number.isNaN(expiry)) return false;
  // `expiresAt > now` on the backend, so an expiry exactly at `now` is spent.
  return expiry <= now.getTime();
}

export function isUsedUp(coupon: Coupon): boolean {
  return (
    coupon.maxUsageCount !== null && coupon.usageCount >= coupon.maxUsageCount
  );
}

/** True when the stored status and the real behaviour have come apart. */
export function isSilentlyDead(coupon: Coupon, now: Date = new Date()): boolean {
  return coupon.status === "ACTIVE" && couponState(coupon, now) !== "LIVE";
}

const STATE_LABELS: Record<CouponState, string> = {
  LIVE: "Live",
  SCHEDULED: "Scheduled",
  EXPIRED: "Expired",
  USED_UP: "Used up",
  DISABLED: "Disabled",
};

/**
 * Only LIVE gets a colour. A coupon that cannot be redeemed is not a warning
 * or an error — it is simply not doing anything, and three shades of grey-ish
 * "off" would make the one row that IS spending money harder to find.
 */
const STATE_TONES: Record<CouponState, Tone> = {
  LIVE: "success",
  // Scheduled is muted with the rest, not coloured. It cannot be redeemed
  // today, and the rule above is about what is spending money right now.
  SCHEDULED: "muted",
  EXPIRED: "muted",
  USED_UP: "muted",
  DISABLED: "muted",
};

export function couponStateLabel(state: CouponState): string {
  return STATE_LABELS[state];
}

export function couponStateClasses(state: CouponState): string {
  return TONE_CLASSES[STATE_TONES[state]];
}

/** Why the row reads as it does, for the badge's `title` and the edit page. */
export function couponStateHint(coupon: Coupon, now: Date = new Date()): string {
  switch (couponState(coupon, now)) {
    case "LIVE":
      return "Customers can redeem this code right now.";
    case "SCHEDULED":
      return `Not open yet — the till rejects it until ${formatDate(coupon.startsAt)}, even though it is stored as ${couponStatusLabel(coupon.status).toLowerCase()}.`;
    case "DISABLED":
      return "Switched off. The code is rejected at checkout, and the redemptions it already has stay on record.";
    case "USED_UP":
      return `Every one of its ${coupon.maxUsageCount} redemptions has been used. Still stored as ${couponStatusLabel(coupon.status).toLowerCase()}, but the till rejects it.`;
    case "EXPIRED":
      return coupon.status === "ACTIVE"
        ? "Past its expiry date, so the till rejects it — even though it is still stored as active."
        : "Past its expiry date.";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stored status — what the API filters on
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<CouponStatus, string> = {
  ACTIVE: "Active",
  DISABLED: "Disabled",
  EXPIRED: "Expired",
};

export function couponStatusLabel(status?: string): string {
  return STATUS_LABELS[status as CouponStatus] ?? status ?? "Unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// The offer, in words
// ─────────────────────────────────────────────────────────────────────────────

/** "20% off" / "₦2,000 off". The headline number, nothing else. */
export function discountSummary(coupon: Coupon): string {
  return coupon.discountType === "PERCENTAGE"
    ? `${formatPercent(coupon.discountValue)}% off`
    : `${formatPrice(coupon.discountValue)} off`;
}

/**
 * The strings attached, in the order they bite: the cap first (it changes what
 * the headline is worth), then the floor, then the per-customer limit.
 *
 * A `maxDiscountAmount` on a FIXED_AMOUNT coupon is dropped rather than shown.
 * The backend stores it and never applies it — only the PERCENTAGE branch
 * consults it — so printing it would describe a cap that does not exist.
 */
export function discountConditions(coupon: Coupon): string[] {
  const parts: string[] = [];

  if (coupon.discountType === "PERCENTAGE" && coupon.maxDiscountAmount) {
    parts.push(`max ${formatPrice(coupon.maxDiscountAmount)}`);
  }
  if (coupon.minOrderAmount) {
    parts.push(`carts over ${formatPrice(coupon.minOrderAmount)}`);
  }
  parts.push(
    coupon.maxUsagePerUser === 1
      ? "once per customer"
      : `${coupon.maxUsagePerUser}× per customer`,
  );

  return parts;
}

/** Percentages are stored as decimals; show 20, not 20.00, and 12.5 as 12.5. */
export function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

/** What one redemption is worth at most, for the "exposure" read. */
export function maxDiscountPerOrder(coupon: Coupon): number | null {
  if (coupon.discountType === "FIXED_AMOUNT") return coupon.discountValue;
  return coupon.maxDiscountAmount;
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage
// ─────────────────────────────────────────────────────────────────────────────

/** "23 of 500" for a capped coupon, "23 used" for an uncapped one. */
export function usageSummary(coupon: Coupon): string {
  if (coupon.maxUsageCount === null) {
    return coupon.usageCount === 1 ? "1 used" : `${coupon.usageCount} used`;
  }
  return `${coupon.usageCount} of ${coupon.maxUsageCount}`;
}

/** 0–1, or `null` when the coupon has no total cap to fill. */
export function usageFraction(coupon: Coupon): number | null {
  if (coupon.maxUsageCount === null || coupon.maxUsageCount <= 0) return null;
  return Math.min(1, coupon.usageCount / coupon.maxUsageCount);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dates
// ─────────────────────────────────────────────────────────────────────────────

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * "in 12 days" / "3 days ago" / "Never expires".
 *
 * Relative, because the question staff are actually asking a coupon list is
 * "how long is this thing live for", and nobody answers that from a date
 * without doing arithmetic. The absolute date rides alongside it in the table.
 */
export function expiryPhrase(
  coupon: Coupon,
  now: Date = new Date(),
): string {
  if (!coupon.expiresAt) return "Never expires";
  const expiry = new Date(coupon.expiresAt).getTime();
  if (Number.isNaN(expiry)) return "—";

  const days = Math.round((expiry - now.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

/**
 * An expiry this close is worth flagging while there is still time to extend
 * it. Seven days is a judgement call, not a backend rule.
 */
const EXPIRING_SOON_DAYS = 7;

export function isExpiringSoon(coupon: Coupon, now: Date = new Date()): boolean {
  if (!coupon.expiresAt || couponState(coupon, now) !== "LIVE") return false;
  const expiry = new Date(coupon.expiresAt).getTime();
  if (Number.isNaN(expiry)) return false;
  return expiry - now.getTime() <= EXPIRING_SOON_DAYS * 86_400_000;
}

// ─────────────────────────────────────────────────────────────────────────────
// Codes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What the backend accepts: capital letters and digits, 3–50 characters.
 * `save20`, `Save20`, `SAVE-20` and `SAVE 20` are all rejected with a 400.
 */
export const COUPON_CODE_PATTERN = /^[A-Z0-9]{3,50}$/;

/**
 * Nudge a typed code toward something the API will accept — uppercase, and
 * strip what the pattern forbids — so a form doesn't reject "save 20" for
 * reasons the user has to read to understand.
 *
 * Length is NOT clamped here: truncating as someone types would silently eat
 * the tail of a long code. The schema reports that instead.
 */
export function normalizeCouponCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
