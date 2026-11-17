/**
 * Price age (ask 42): how long since a person last set or confirmed an item's
 * price. The backend stores `priceCheckedAt` on products and parts; a staff
 * price edit or a "Still correct" click moves it, nothing else does.
 *
 * Note: the migration back-filled every item from its last logged price edit
 * (the log starts 2026-11-04) or its creation date, so most older items read
 * as stale until staff check them.
 */

/**
 * Response of both "Still correct" endpoints. Unknown ids are skipped, so
 * `updated` can be lower than the ids sent.
 */
export interface PriceCheckResult {
  updated: number;
  priceCheckedAt: string;
}

/** The backend accepts 1 to 200 ids per "Still correct" call. */
export const PRICE_CHECK_MAX_IDS = 200;

/**
 * Send ids to a "Still correct" endpoint in batches the backend accepts, one
 * after another, and add up the counts.
 */
export async function confirmPricesInBatches(
  ids: string[],
  send: (batch: string[]) => Promise<PriceCheckResult>,
): Promise<PriceCheckResult> {
  let updated = 0;
  let priceCheckedAt = new Date().toISOString();
  for (let i = 0; i < ids.length; i += PRICE_CHECK_MAX_IDS) {
    const res = await send(ids.slice(i, i + PRICE_CHECK_MAX_IDS));
    updated += res.updated;
    priceCheckedAt = res.priceCheckedAt;
  }
  return { updated, priceCheckedAt };
}

/** Days after which a price counts as stale (dashboard card, row warning). */
export const STALE_PRICE_DAYS = 30;

/** The "price not checked for N+ days" filter choices. */
export const PRICE_AGE_OPTIONS = [30, 60, 90] as const;
export type PriceAgeDays = (typeof PRICE_AGE_OPTIONS)[number];

/** Narrow an untrusted value (a URL param) to an allowed price-age choice. */
export function toPriceAgeDays(value: number | undefined): PriceAgeDays | undefined {
  return PRICE_AGE_OPTIONS.find((d) => d === value);
}

/**
 * Query-key root for the price-age count. Lives here, not in a feature, so
 * the products and parts confirm mutations can invalidate the dashboard card.
 */
export const PRICE_AGE_QUERY_KEY = ["price-age"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The `priceCheckedBefore` cut-off for "not checked in `days` days". */
export function priceCheckedBefore(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

/** Whole days since `checkedAt`; never negative (clock skew). */
export function priceAgeDays(checkedAt: string, now: Date = new Date()): number {
  const ms = now.getTime() - new Date(checkedAt).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / DAY_MS)) : 0;
}

/** "Today", "1 day ago", "42 days ago". */
export function priceAgeLabel(days: number): string {
  if (days === 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
