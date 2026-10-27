// Hunt price math.
//
// The API stores a percentage per hunt deal and never a price. The backend
// prices the item off its cheapest variant (`getPublicHuntCampaign` sorts
// variants by `basePrice` ascending, takes one, and rounds to the naira), and
// that number is what customers see announced. Staff think in naira, so this
// file repeats the backend's sum rather than showing "-99.4%".

import { formatPrice } from "@/lib/utils/format";
import type { HuntProductPricing } from "../types/hunts";

/**
 * The lowest `basePrice` among a product's variants, or null when none has one.
 *
 * Nulls are skipped because Postgres sorts them last on an ascending order, so
 * the backend never picks one while a priced variant exists. Inactive variants
 * are not skipped: the backend's query does not filter them either.
 */
export function cheapestBasePrice(
  variants: ReadonlyArray<{ basePrice?: number | null }>,
): number | null {
  let min: number | null = null;
  for (const { basePrice } of variants) {
    if (basePrice == null || !Number.isFinite(basePrice)) continue;
    if (min === null || basePrice < min) min = basePrice;
  }
  return min;
}

/** The backend's own line: `Math.max(0, Math.round(base * (1 + pct / 100)))`. */
export function huntPrice(basePrice: number, markupPercentage: number): number {
  return Math.max(0, Math.round(basePrice * (1 + markupPercentage / 100)));
}

/** The deepest discount the create route accepts: 99% off. */
export const HUNT_MIN_PERCENTAGE = -99;

/**
 * The percentage that lands nearest a naira price staff typed.
 *
 * Rounded to two places because the markup rule column is `DECIMAL(6,2)`: a
 * finer number would be cut when the drop starts, and customers would pay the
 * cut price, not this one. So the typed price is a target. What customers pay
 * is `huntPrice(base, percentageForPrice(base, typed))`, and on a large base
 * the two can differ by tens of naira (one step is 0.01% of base).
 */
export function percentageForPrice(basePrice: number, price: number): number {
  const exact = (price / basePrice - 1) * 100;
  // `+ 0` turns the -0 that Math.round gives near zero into 0.
  return Math.round(exact * 100) / 100 + 0;
}

/** The lowest hunt price the backend allows on this base: 99% off. */
export function lowestHuntPrice(basePrice: number): number {
  return huntPrice(basePrice, HUNT_MIN_PERCENTAGE);
}

/**
 * "₦8,450", or "from ₦8,450" when the product has other variants, since a
 * customer adding a dearer variant pays a different number.
 *
 * Null when the base price is unknown. Printing ₦0 there would read as a real
 * price.
 */
export function huntPriceLabel(
  pricing: HuntProductPricing | undefined,
  markupPercentage: number,
): string | null {
  if (!pricing || pricing.cheapestBasePrice === null) return null;
  const price = formatPrice(huntPrice(pricing.cheapestBasePrice, markupPercentage));
  return pricing.variantCount > 1 ? `from ${price}` : price;
}

/**
 * A drop's real discount, or null when neither source has it.
 *
 * The campaign response reads `markupPercentage` off the deal's markup rule,
 * and a Deal writes no rule until it starts, so every drop that has not opened
 * yet comes back as 0 (backend ask 33). A hunt discount is never 0 (the create
 * route requires it below zero), so 0 means "not materialised" and the Deal's
 * own stored target is used instead.
 */
export function resolvePercentage(
  reported: number,
  stored: number | undefined,
): number | null {
  if (reported < 0) return reported;
  return stored !== undefined && stored < 0 ? stored : null;
}

/** "−99.4%": the stored percentage as a discount, trimmed to two places. */
export function discountLabel(markupPercentage: number): string {
  return `−${Number(Math.abs(markupPercentage).toFixed(2))}%`;
}
