import Link from "next/link";

import { AppIcon } from "@/components/shared/app-icon";
import { Stat, StatsBar, type StatTone } from "@/components/shared/stats-bar";
import type { ProductStats } from "../types/products";

interface ProductsStatsBarProps {
  stats: ProductStats;
  /** Browse-view deep link for the low-stock card + banner. */
  lowStockHref: string;
  /** Browse-view deep link for the out-of-stock card. */
  outOfStockHref: string;
}

const CARDS: {
  key: keyof ProductStats;
  title: string;
  icon: string;
  tone: StatTone;
}[] = [
  {
    key: "total",
    title: "Total products",
    icon: "solar:box-linear",
    tone: "primary",
  },
  {
    key: "active",
    title: "Active products",
    icon: "solar:check-circle-linear",
    tone: "success",
  },
  {
    key: "lowStock",
    title: "Low stock",
    icon: "solar:danger-circle-linear",
    tone: "warning",
  },
  {
    key: "outOfStock",
    title: "Out of stock",
    icon: "solar:close-circle-linear",
    tone: "danger",
  },
];

export function ProductsStatsBar({
  stats,
  lowStockHref,
  outOfStockHref,
}: ProductsStatsBarProps) {
  const hrefByKey: Partial<Record<keyof ProductStats, string>> = {
    lowStock: lowStockHref,
    outOfStock: outOfStockHref,
  };

  return (
    <div className="space-y-4">
      <StatsBar>
        {CARDS.map((card) => (
          <Stat
            key={card.key}
            icon={card.icon}
            tone={card.tone}
            label={card.title}
            value={stats[card.key]}
            href={hrefByKey[card.key]}
          />
        ))}
      </StatsBar>

      {stats.needsRestock > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning-ink">
          <AppIcon
            icon="solar:danger-circle-linear"
            className="size-4 shrink-0"
          />
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
