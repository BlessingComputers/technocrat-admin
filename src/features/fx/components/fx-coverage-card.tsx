"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";

import { useFxCoverage } from "../api/fx.queries";
import type { FxCoverageCount } from "../types/fx";
import { coveragePercent } from "../utils/fx-format";

function CoverageRow({
  label,
  count,
  href,
}: {
  label: string;
  count: FxCoverageCount;
  href: string;
}) {
  const pct = coveragePercent(count.linked, count.total);
  return (
    <Link
      href={href}
      className="group block space-y-3 rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <MetaLabel className="block text-muted-foreground">{label}</MetaLabel>
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {count.linked.toLocaleString("en-GB")}
            <span className="text-base font-medium text-muted-foreground">
              {" "}
              of {count.total.toLocaleString("en-GB")}
            </span>
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-primary-ink">
          View linked
          <AppIcon
            icon="solar:alt-arrow-right-linear"
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${pct}% of active ${label.toLowerCase()} follow the dollar`}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}

/**
 * How much of the catalogue follows the dollar. Counts come from the
 * `fxLinked` filter on `/products/all` and `/products/parts`, never from
 * search, which ignores the filter (backend #299).
 */
export function FxCoverageCard() {
  const { data, isLoading, isError } = useFxCoverage();

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-ink">
            <AppIcon icon="solar:dollar-minimalistic-linear" className="size-5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-foreground">Coverage</h2>
            <p className="text-sm text-muted-foreground">
              Active items whose price follows the dollar rate. The rest keep
              their Naira price.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-[92px] rounded-lg" />
            <Skeleton className="h-[92px] rounded-lg" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground">
            The coverage count is not available right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CoverageRow
              label="Products"
              count={data.products}
              href="/catalogues/all?fx=linked"
            />
            <CoverageRow
              label="Parts"
              count={data.parts}
              href="/catalogues/parts?fx=linked&status=active"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
