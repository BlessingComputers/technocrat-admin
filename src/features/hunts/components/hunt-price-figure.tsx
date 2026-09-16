"use client";

import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

import type { HuntProductPricing } from "../types/hunts";
import { discountLabel, huntPriceLabel } from "../utils/hunt-price";

interface HuntPriceFigureProps {
  pricing?: HuntProductPricing;
  /** The resolved discount, or null when it could not be read. */
  percentage: number | null;
  isLoading: boolean;
  className?: string;
}

/**
 * A drop's price in naira, with the discount and base price under it.
 *
 * The price needs two reads besides the campaign (the product's base price and,
 * before a drop starts, the Deal's stored discount). When one is missing this
 * says which, rather than print a number that is wrong.
 */
export function HuntPriceFigure({
  pricing,
  percentage,
  isLoading,
  className,
}: HuntPriceFigureProps) {
  const price = percentage === null ? null : huntPriceLabel(pricing, percentage);
  const base = pricing?.cheapestBasePrice ?? null;

  const detail =
    percentage !== null && base !== null
      ? `${discountLabel(percentage)} off ${formatPrice(base)}`
      : isLoading
        ? "Loading prices"
        : percentage !== null
          ? `${discountLabel(percentage)} off a base price we couldn’t load`
          : base !== null
            ? `Base ${formatPrice(base)}, discount couldn’t load`
            : "Couldn’t load the discount or base price";

  return (
    <div className={className}>
      <p
        className={cn(
          "text-sm font-semibold",
          price ? "font-mono tabular-nums text-foreground" : "text-muted-foreground",
        )}
      >
        {price ?? (isLoading ? "…" : "Price unknown")}
      </p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
