import Link from "next/link";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type { ProductStats } from "../types/products";
import { MetaLabel } from "@/components/shared/meta-label";

interface ProductsStatsBarProps {
  stats: ProductStats;
  /** Browse-view deep link for the low-stock card + banner. */
  lowStockHref: string;
  /** Browse-view deep link for the out-of-stock card. */
  outOfStockHref: string;
  /** Shows a pulse in place of each value while the counts resolve. */
  isLoading?: boolean;
}

const CARDS = [
  {
    key: "total" as const,
    title: "Total Products",
    icon: "solar:box-linear",
    chip: "bg-primary/10 text-primary-ink",
  },
  {
    key: "active" as const,
    title: "Active Products",
    icon: "solar:check-circle-linear",
    chip: "bg-success/15 text-success-ink",
  },
  {
    key: "lowStock" as const,
    title: "Low Stock",
    icon: "solar:danger-circle-linear",
    chip: "bg-warning/15 text-warning-ink",
  },
  {
    key: "outOfStock" as const,
    title: "Out of Stock",
    icon: "solar:close-circle-linear",
    chip: "bg-destructive/12 text-destructive-ink",
  },
];

export function ProductsStatsBar({
  stats,
  lowStockHref,
  outOfStockHref,
  isLoading,
}: ProductsStatsBarProps) {
  const hrefByKey: Partial<Record<(typeof CARDS)[number]["key"], string>> = {
    lowStock: lowStockHref,
    outOfStock: outOfStockHref,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const href = hrefByKey[card.key];
          const inner = (
            <Card
              className={cn(
                "p-6",
                href &&
                  "transition-colors hover:border-primary/40 hover:bg-muted/30",
              )}
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg",
                    card.chip,
                  )}
                >
                  <AppIcon icon={card.icon} className="h-6 w-6" />
                </div>
                {href && (
                  <AppIcon
                    icon="solar:arrow-right-up-linear"
                    className="size-4 text-muted-foreground"
                  />
                )}
              </div>
              <MetaLabel className="block mb-1">
                {card.title}
              </MetaLabel>
              {isLoading ? (
                <div className="mt-1 h-8 w-12 animate-pulse rounded bg-muted" />
              ) : (
                <h3 className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                  {stats[card.key].toLocaleString()}
                </h3>
              )}
            </Card>
          );

          return href ? (
            <Link key={card.key} href={href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={card.key}>{inner}</div>
          );
        })}
      </div>

      {!isLoading && stats.needsRestock > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning-ink">
          <AppIcon icon="solar:danger-circle-linear" className="size-4 shrink-0" />
          <span>
            <strong>{stats.needsRestock}</strong> products are low on or out of
            stock.{" "}
            <Link
              href={lowStockHref}
              className="font-medium underline underline-offset-2 hover:text-warning-ink/80"
            >
              View affected
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
