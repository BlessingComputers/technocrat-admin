"use client";

import { cn } from "@/lib/utils/cn";
import { COUPON_STATUSES, type CouponStatus } from "../types/coupons";
import { couponStatusLabel } from "../utils/coupon-utils";
import { CouponsStatusChipsSkeleton } from "./coupons-skeletons";

interface CouponsStatusChipsProps {
  active?: CouponStatus;
  counts: Record<CouponStatus, number | undefined>;
  total?: number;
  isLoading: boolean;
  onSelect: (status: CouponStatus | undefined) => void;
}

/**
 * The status filter and the "how many codes are live" readout, as one row.
 *
 * A count you can click beats a count you can only look at — the same argument
 * as the pre-orders queue. It matters more here: the number of ACTIVE coupons
 * is the single figure worth checking before minting another, because every
 * one of them is spending money on every order that finds it.
 *
 * These chips filter on the **stored** status, because that is the only thing
 * `?status=` accepts. Rows underneath show what the till would actually do,
 * which is not always the same — hence the line of copy beneath. Two
 * vocabularies on one screen is a cost; hiding the seam would be worse.
 */
export function CouponsStatusChips({
  active,
  counts,
  total,
  isLoading,
  onSelect,
}: CouponsStatusChipsProps) {
  if (isLoading) {
    return <CouponsStatusChipsSkeleton />;
  }

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter coupons by stored status"
      >
        <Chip
          label="All"
          count={total}
          isActive={!active}
          onClick={() => onSelect(undefined)}
        />
        {COUPON_STATUSES.map((status) => (
          <Chip
            key={status}
            label={couponStatusLabel(status)}
            count={counts[status]}
            isActive={active === status}
            onClick={() => onSelect(status)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        These count the stored status. A code past its expiry or its redemption
        limit stops working at checkout while still sitting under
        &ldquo;Active&rdquo; — the badge on each row is the one that says what
        customers get.
      </p>
    </div>
  );
}

interface ChipProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Unlike the pre-orders chips, these carry no per-status tone. There are three
 * stored statuses and only one of them (ACTIVE) is even approximately a state
 * a customer experiences, so tinting all three would be colour spent on a
 * distinction the row badges make properly.
 */
function Chip({ label, count, isActive, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2",
        "text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground border-border hover:brightness-95 dark:hover:brightness-110",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "tabular-nums rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            isActive ? "bg-primary-foreground/20" : "bg-foreground/10",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
