"use client";

import { useState } from "react";
import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";
import { CouponStateBadge } from "./coupon-state-badge";
import { CouponPowerAction } from "./coupon-power-action";
import {
  couponState,
  discountConditions,
  discountSummary,
  expiryPhrase,
  formatDate,
  isExpiringSoon,
  usageFraction,
  usageSummary,
} from "../utils/coupon-utils";
import type { Coupon } from "../types/coupons";

interface CouponTableRowProps {
  coupon: Coupon;
}

export function CouponTableRow({ coupon }: CouponTableRowProps) {
  const state = couponState(coupon);
  const isLive = state === "LIVE";
  const expiringSoon = isExpiringSoon(coupon);
  const fraction = usageFraction(coupon);
  // The edit route keys on the code, not the UUID — there is no endpoint to
  // fetch one coupon by id. See `couponService.findByCode`.
  // By id, not code: `GET /admin/coupons/{id}` reads the row directly, where a
  // code has to be found by listing and scanning. The route still accepts a
  // code, so links shared before this changed keep working.
  const href = `/coupons/${coupon.id}/edit`;

  return (
    <tr
      className={cn(
        "group transition-colors hover:bg-muted/30",
        // A retired coupon is still worth reading, just not worth looking at
        // first. Dimming the whole row is what lets the live ones carry the
        // list without any of them needing to shout.
        !isLive && "opacity-70 hover:opacity-100",
      )}
    >
      {/* Code. Monospaced and full-size: it is the thing staff read out loud,
          paste into a banner, and search for. */}
      <td className="px-8 py-5">
        <div className="flex items-center gap-2">
          <Link
            href={href}
            className="font-mono text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-primary-ink"
          >
            {coupon.code}
          </Link>
          <CopyCodeButton code={coupon.code} />
        </div>
        <MetaLabel className="mt-0.5 block max-w-[28ch] truncate">
          {coupon.description || coupon.couponId}
        </MetaLabel>
      </td>

      {/* The offer. Headline on top, the strings attached underneath — a cap
          and a minimum change what "20% off" is worth, so they belong in the
          same cell rather than in columns most rows leave empty. */}
      <td className="px-8 py-5">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {discountSummary(coupon)}
        </p>
        <MetaLabel className="mt-0.5 block">
          {discountConditions(coupon).join(" · ")}
        </MetaLabel>
      </td>

      {/* Usage. The bar only appears when there is a cap to fill — a progress
          bar against "unlimited" would be a bar that never means anything. */}
      <td className="px-8 py-5">
        <p className="text-xs font-semibold tabular-nums text-foreground">
          {usageSummary(coupon)}
        </p>
        {fraction !== null && (
          <div
            className="mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-muted"
            role="presentation"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                fraction >= 1 ? "bg-muted-foreground/50" : "bg-primary",
              )}
              style={{ width: `${Math.round(fraction * 100)}%` }}
            />
          </div>
        )}
      </td>

      <td className="px-8 py-5">
        <CouponStateBadge coupon={coupon} />
      </td>

      {/* Expiry, relative first. "in 4 days" is the answer to the question
          being asked; the date is there to confirm it. */}
      <td className="px-8 py-5">
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold",
            expiringSoon ? "text-warning-ink" : "text-muted-foreground",
          )}
        >
          {expiringSoon && (
            <AppIcon
              icon="solar:clock-circle-bold"
              className="size-3.5 text-warning-ink"
            />
          )}
          {expiryPhrase(coupon)}
        </p>
        {coupon.expiresAt && (
          <MetaLabel className="mt-0.5 block">
            {formatDate(coupon.expiresAt)}
          </MetaLabel>
        )}
      </td>

      {/* Actions. Switching a code off happens from the row: when a bad coupon
          is live, the trip through an edit page is the expensive part. */}
      <td className="px-8 py-5">
        <div className="flex items-center justify-end gap-2">
          <CouponPowerAction coupon={coupon} />
          <Link
            href={href}
            aria-label={`Edit ${coupon.code}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary-ink"
          >
            <AppIcon icon="solar:pen-2-linear" className="size-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

/**
 * Copying the code is the single most common thing anyone does with this
 * screen — it goes into a banner, a WhatsApp broadcast, an email. Worth a
 * dedicated control rather than making people select eight characters of
 * monospace by hand.
 */
function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${code}`}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      <AppIcon
        icon={copied ? "solar:check-circle-bold" : "solar:copy-linear"}
        className={cn("size-3.5", copied && "text-success-ink")}
      />
    </button>
  );
}
