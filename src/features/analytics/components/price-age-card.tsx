"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { STALE_PRICE_DAYS } from "@/lib/utils/price-age";
import { usePriceAge } from "../api/analytics.queries";

/** Opens each list filtered to stale prices, oldest check first. */
const PRODUCTS_HREF = `/catalogues/all?priceAge=${STALE_PRICE_DAYS}&sort=priceChecked&dir=asc`;
const PARTS_HREF = `/catalogues/parts?priceAge=${STALE_PRICE_DAYS}&sort=priceChecked`;

function CountRow({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
    >
      <div className="space-y-0.5">
        <MetaLabel className="block text-muted-foreground">{label}</MetaLabel>
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {count.toLocaleString("en-GB")}
        </span>
      </div>
      <span className="flex items-center gap-1 text-xs font-medium text-primary-ink">
        Review
        <AppIcon
          icon="solar:alt-arrow-right-linear"
          className="size-4 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

/**
 * Dashboard card for ask 42: active products and parts whose price nobody
 * has set or confirmed in 30+ days. Each count opens its list, filtered and
 * sorted oldest check first. Hidden behind `products:read` by the caller.
 */
export function PriceAgeCard() {
  const { data, isLoading, isError } = usePriceAge(STALE_PRICE_DAYS);

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning-ink">
            <AppIcon icon="solar:clock-circle-linear" className="size-5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-foreground">
              Prices to check
            </h2>
            <p className="text-sm text-muted-foreground">
              Not set or confirmed in {STALE_PRICE_DAYS}+ days. Fix the price,
              or mark it as still correct.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-[74px] rounded-lg" />
            <Skeleton className="h-[74px] rounded-lg" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground">
            The stale-price count is not available right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CountRow label="Products" count={data.products} href={PRODUCTS_HREF} />
            <CountRow label="Parts" count={data.parts} href={PARTS_HREF} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
