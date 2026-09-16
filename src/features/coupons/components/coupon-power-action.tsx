"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { cn } from "@/lib/utils/cn";
import { getErrorMessage } from "@/lib/api/error-message";
import { useUpdateCoupon } from "../api/coupons.queries";
import { isPastExpiry, isUsedUp } from "../utils/coupon-utils";
import type { Coupon } from "../types/coupons";

interface CouponPowerActionProps {
  coupon: Coupon;
  /** `sm` for a table row, `default` for the edit page's panel. */
  size?: "sm" | "default";
  className?: string;
}

/**
 * The stop button — and the only one there is.
 *
 * `status: DISABLED` is the whole mechanism. There is no DELETE endpoint, which
 * is correct: the row is referenced by `coupon_usages` and by every order that
 * redeemed it, so deleting it would take the discount off historical orders.
 *
 * Both directions confirm, which is unusual in this app (the pre-orders queue
 * deliberately skips the dialog on its routine moves) and is the right call
 * here. Switching a code off is not routine — it is what you do when something
 * is wrong — and switching one ON puts a live discount into the world, which
 * is the more expensive mistake of the two.
 */
export function CouponPowerAction({
  coupon,
  size = "sm",
  className,
}: CouponPowerActionProps) {
  const { mutateAsync, isPending } = useUpdateCoupon();
  const [confirming, setConfirming] = useState(false);

  const isOff = coupon.status !== "ACTIVE";
  const nextStatus = isOff ? "ACTIVE" : "DISABLED";

  const apply = () => {
    const promise = mutateAsync({
      id: coupon.id,
      input: { status: nextStatus },
    });

    toast.promise(promise, {
      loading: isOff ? "Switching on…" : "Switching off…",
      success: isOff
        ? `${coupon.code} is live.`
        : `${coupon.code} is switched off.`,
      error: (err) => getErrorMessage(err, "Could not change this coupon."),
    });

    // `toast.promise` already surfaces the failure; swallow the rejection so it
    // doesn't also escape as an unhandled promise.
    promise
      .then(() => setConfirming(false))
      .catch(() => setConfirming(false));
  };

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className={cn(
          "gap-2 font-medium",
          // Only the destructive direction gets the colour. An "on" button
          // tinted green on every disabled row would make a list of retired
          // coupons look like a list of buttons to press.
          isOff ? "" : "text-destructive-ink hover:text-destructive-ink",
          className,
        )}
      >
        <AppIcon
          icon={isOff ? "solar:power-linear" : "solar:forbidden-circle-linear"}
          className="size-4"
        />
        {isOff ? "Switch on" : "Switch off"}
      </Button>

      <ConfirmModal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={apply}
        isPending={isPending}
        variant={isOff ? "primary" : "destructive"}
        title={
          isOff ? `Make ${coupon.code} live?` : `Switch off ${coupon.code}?`
        }
        description={confirmationCopy(coupon)}
        confirmText={isOff ? "Make it live" : "Switch it off"}
      />
    </>
  );
}

/**
 * What actually happens, rather than a restatement of the button.
 *
 * The line worth spelling out on the way off is that redemptions do not come
 * back: `createOrder()` writes `coupon_usages` and increments `usageCount`
 * permanently, and neither cancelling nor refunding that order reverses it. So
 * switching off stops the bleeding and nothing else.
 *
 * On the way on, the useful warnings are the two ways a coupon can be switched
 * on and still not work — the checkout query filters on `expiresAt > now` and
 * the usage cap before it ever looks at anything else.
 */
function confirmationCopy(coupon: Coupon): string {
  if (coupon.status === "ACTIVE") {
    return `Customers stop being able to use ${coupon.code} straight away. The ${coupon.usageCount === 1 ? "one redemption" : `${coupon.usageCount} redemptions`} it already has stay on the orders that used them — switching off never claws a discount back.`;
  }

  if (isPastExpiry(coupon)) {
    return `${coupon.code} is past its expiry date, so switching it on will not make it work — checkout rejects an expired code whatever its status. Move the expiry first.`;
  }

  if (isUsedUp(coupon)) {
    return `${coupon.code} has used all ${coupon.maxUsageCount} of its redemptions, so switching it on will not make it work. Raise the limit first.`;
  }

  return `${coupon.code} becomes redeemable immediately — there is no scheduling step. Check the discount and the limits below before confirming.`;
}
