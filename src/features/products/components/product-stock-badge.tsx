import { cn } from "@/lib/utils/cn";
import { STOCK_LABEL, STOCK_PILL } from "../constants/product-display";

interface ProductStockBadgeProps {
  /** Backend availability code (IN_STOCK | LOW_STOCK | OUT_OF_STOCK). */
  status?: string;
  className?: string;
}

/**
 * Availability pill shared by the products table row and the hub snapshot.
 * Falls back to "Out of Stock" styling for an unknown/absent status.
 */
export function ProductStockBadge({ status, className }: ProductStockBadgeProps) {
  const key = status || "OUT_OF_STOCK";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        STOCK_PILL[key] ?? STOCK_PILL.OUT_OF_STOCK,
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {STOCK_LABEL[key] ?? "Out of Stock"}
    </span>
  );
}
