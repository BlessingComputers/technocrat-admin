import { cn } from "@/lib/utils/cn";
import {
  PART_STOCK_LABEL,
  PART_STOCK_PILL,
  partStockState,
} from "../constants/part-display";

interface PartsStockBadgeProps {
  isInStock: boolean;
  stockQuantity: number;
  /** Append the unit count, e.g. "In Stock · 12". */
  showCount?: boolean;
  className?: string;
}

/** Availability pill for a part, derived from `isInStock` + `stockQuantity`. */
export function PartsStockBadge({
  isInStock,
  stockQuantity,
  showCount = true,
  className,
}: PartsStockBadgeProps) {
  const state = partStockState(isInStock, stockQuantity);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        PART_STOCK_PILL[state],
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {PART_STOCK_LABEL[state]}
      {showCount && state !== "OUT_OF_STOCK" && (
        <span className="tabular-nums opacity-70">· {stockQuantity}</span>
      )}
    </span>
  );
}
