import Link from "next/link";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";

interface CatalogueOverviewStatsProps {
  productTotal: number;
  productOutOfStock: number;
  partTotal: number;
  partOutOfStock: number;
  isLoading?: boolean;
}

/**
 * The hub's "All" KPI row — the whole catalogue, and how it splits.
 *
 * Products and parts are different models on the backend (parts have no
 * low-stock state, products have no part types), so this row deliberately does
 * NOT try to sum "Active" or "Low stock" across the two. It answers the only
 * two questions that are meaningful catalogue-wide: how big is it, and how much
 * of it is unsellable. The per-domain health numbers live behind the Products
 * and Parts filters, where the models actually match.
 */
export function CatalogueOverviewStats({
  productTotal,
  productOutOfStock,
  partTotal,
  partOutOfStock,
  isLoading,
}: CatalogueOverviewStatsProps) {
  const cards = [
    {
      key: "items",
      title: "Catalogue Items",
      icon: "solar:widget-4-linear",
      chip: "bg-primary/10 text-primary-ink",
      value: productTotal + partTotal,
      href: undefined,
    },
    {
      key: "products",
      title: "Products",
      icon: "solar:box-linear",
      chip: "bg-info/10 text-info-ink",
      value: productTotal,
      href: "/catalogues/all",
    },
    {
      key: "parts",
      title: "Parts",
      icon: "solar:cpu-bolt-linear",
      chip: "bg-success/15 text-success-ink",
      value: partTotal,
      href: "/catalogues/parts",
    },
    {
      key: "out",
      title: "Out of Stock",
      icon: "solar:close-circle-linear",
      chip: "bg-destructive/12 text-destructive-ink",
      value: productOutOfStock + partOutOfStock,
      href: undefined,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const inner = (
          <Card
            className={cn(
              "p-6",
              card.href &&
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
              {card.href && (
                <AppIcon
                  icon="solar:arrow-right-up-linear"
                  className="size-4 text-muted-foreground"
                />
              )}
            </div>
            <MetaLabel className="mb-1 block">{card.title}</MetaLabel>
            {isLoading ? (
              <div className="mt-1 h-8 w-12 animate-pulse rounded bg-muted" />
            ) : (
              <h3 className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                {card.value.toLocaleString()}
              </h3>
            )}
          </Card>
        );

        return card.href ? (
          <Link key={card.key} href={card.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={card.key}>{inner}</div>
        );
      })}
    </div>
  );
}
