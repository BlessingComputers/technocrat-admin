import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import {
  STALE_PRICE_DAYS,
  priceAgeDays,
  priceAgeLabel,
} from "@/lib/utils/price-age";

interface PriceAgeBadgeProps {
  /** ISO `priceCheckedAt` from the product or part. */
  checkedAt: string;
  className?: string;
}

/**
 * How long since a person last set or confirmed this price. Stale prices
 * (30+ days) get the warning ink AND an icon, so the state is never colour
 * alone. The exact date sits in the tooltip.
 */
export function PriceAgeBadge({ checkedAt, className }: PriceAgeBadgeProps) {
  const days = priceAgeDays(checkedAt);
  const stale = days >= STALE_PRICE_DAYS;
  const exact = new Date(checkedAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <span
      title={`Price last checked ${exact}`}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap text-xs",
        stale ? "font-medium text-warning-ink" : "text-muted-foreground",
        className,
      )}
    >
      {stale && (
        <AppIcon icon="solar:clock-circle-linear" className="size-3.5" aria-hidden />
      )}
      {priceAgeLabel(days)}
      {stale && <span className="sr-only"> (may be stale)</span>}
    </span>
  );
}
