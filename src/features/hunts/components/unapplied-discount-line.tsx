"use client";

import Link from "next/link";

/**
 * Shown on a drop whose slot opened without its discount becoming a rule.
 * The price beside it is what staff set, not what customers were charged.
 */
export function UnappliedDiscountLine() {
  return (
    <p className="text-xs font-semibold text-destructive-ink">
      The discount never went live, so this drop was at full price. A standing
      markup on the same product usually blocks it; check{" "}
      <Link href="/pricing/markup" className="underline underline-offset-2">
        Markup
      </Link>
      .
    </p>
  );
}
