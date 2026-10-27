"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { formatPercent } from "../utils/coupon-utils";
import type { CouponFormValues } from "../schemas/coupon-form";

interface CouponOfferPreviewProps {
  values: CouponFormValues;
}

/**
 * The form, read back as a sentence.
 *
 * Four of these fields constrain each other — a percentage, a cap on it, a
 * floor under the cart, and two separate redemption limits — and nobody holds
 * that combination in their head from a column of number inputs. The mistake
 * this catches is the expensive one: "20% off" typed without a cap, which on a
 * laptop order is six figures.
 *
 * Renders from the raw string state rather than the parsed output, on purpose:
 * it has to say something useful while the form is still half-filled and
 * failing validation, which is exactly when it is worth reading.
 */
export function CouponOfferPreview({ values }: CouponOfferPreviewProps) {
  const value = Number(values.discountValue);
  const hasValue = values.discountValue.trim() !== "" && Number.isFinite(value) && value > 0;

  if (!hasValue) return null;

  const isPercentage = values.discountType === "PERCENTAGE";
  const cap = Number(values.maxDiscountAmount);
  const hasCap =
    isPercentage &&
    values.maxDiscountAmount.trim() !== "" &&
    Number.isFinite(cap) &&
    cap > 0;
  const floor = Number(values.minOrderAmount);
  const hasFloor =
    values.minOrderAmount.trim() !== "" && Number.isFinite(floor) && floor > 0;
  const totalCap = Number(values.maxUsageCount);
  const hasTotalCap =
    values.maxUsageCount.trim() !== "" &&
    Number.isFinite(totalCap) &&
    totalCap > 0;
  const perUser = Number(values.maxUsagePerUser);

  const headline = isPercentage
    ? `${formatPercent(value)}% off`
    : `${formatPrice(value)} off`;

  const clauses: string[] = [];
  if (hasCap) clauses.push(`never more than ${formatPrice(cap)}`);
  if (hasFloor) clauses.push(`only on carts over ${formatPrice(floor)}`);
  clauses.push(
    perUser === 1 ? "once per customer" : `up to ${perUser}× per customer`,
  );
  clauses.push(
    hasTotalCap
      ? `${totalCap} redemptions in total`
      : "unlimited redemptions in total",
  );

  // The one combination worth a warning rather than a restatement. Everything
  // else on this panel is description; this is the number that gets a shop into
  // trouble, and it is invisible in the fields themselves.
  const uncappedPercentage = isPercentage && !hasCap;

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="text-xs font-medium text-muted-foreground">
        What this code does
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-foreground">
        {headline}
        <span className="font-medium text-muted-foreground">
          {" — "}
          {clauses.join(", ")}.
        </span>
      </p>

      {uncappedPercentage && (
        <p className="mt-2.5 flex items-start gap-2 text-xs text-warning-ink">
          <AppIcon
            icon="solar:danger-triangle-linear"
            className="mt-0.5 size-3.5 shrink-0"
          />
          No cap, so this takes {formatPercent(value)}% off whatever the cart
          comes to — a single large order could be worth far more than you
          intend. Set a ceiling unless that is deliberate.
        </p>
      )}
    </div>
  );
}
