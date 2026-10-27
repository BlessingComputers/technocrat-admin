import { cn } from "@/lib/utils/cn";
import {
  couponState,
  couponStateClasses,
  couponStateHint,
  couponStateLabel,
} from "../utils/coupon-utils";
import type { Coupon } from "../types/coupons";

interface CouponStateBadgeProps {
  coupon: Coupon;
  className?: string;
}

/**
 * What the till would do with this code — not what the row says.
 *
 * Takes the whole coupon rather than a status string (the shape every other
 * status badge in this app uses) because the answer depends on the expiry and
 * the usage count as much as on the stored status. See `couponState`.
 */
export function CouponStateBadge({ coupon, className }: CouponStateBadgeProps) {
  const state = couponState(coupon);

  return (
    <span
      title={couponStateHint(coupon)}
      className={cn(
        "inline-flex px-2.5 py-1 rounded-full border text-xs font-medium",
        couponStateClasses(state),
        className,
      )}
    >
      {couponStateLabel(state)}
    </span>
  );
}
