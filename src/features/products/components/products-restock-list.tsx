"use client";

import Link from "next/link";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { useProducts } from "../api/products.queries";
import { ProductStockBadge } from "./product-stock-badge";
import { RecentProductsSnapshotSkeleton } from "./products-skeletons";

const LIMIT = 6;

/**
 * Actionable "needs restock" queue for the products hub: out-of-stock items
 * first (most urgent), then low-stock, each row one click from its detail page.
 * Reuses the existing `stock` list filter — no new endpoint. Complements the
 * Inventory Health donut (the donut shows *how much*, this shows *which items*).
 */
export function ProductsRestockList() {
  const out = useProducts({ stock: "out", limit: LIMIT });
  const low = useProducts({ stock: "low", limit: LIMIT });

  const isLoading = out.isLoading || low.isLoading;
  const isError = out.isError || low.isError;
  const items = [...(out.data?.data ?? []), ...(low.data?.data ?? [])].slice(
    0,
    LIMIT,
  );

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden border bg-card p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <AppIcon icon="solar:danger-triangle-bold" className="size-5" />
          </span>
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Needs Restock
            </h3>
            <p className="text-xs text-muted-foreground">
              Low &amp; out-of-stock items to act on
            </p>
          </div>
        </div>
        <Link
          href="/catalogues/all?stock=low"
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <RecentProductsSnapshotSkeleton />
      ) : isError ? (
        <div className="px-4 py-8 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Couldn’t load restock queue
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <AppIcon
            icon="solar:check-circle-bold"
            className="size-8 text-success"
          />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Everything is in stock
          </span>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/catalogues/${p.id}`}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                {p.primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.primaryImage}
                    alt={p.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <AppIcon
                    icon="solar:box-linear"
                    className="size-5 text-muted-foreground/50"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {p.name}
                </p>
                <p className="font-mono text-xs font-medium tabular-nums text-muted-foreground">
                  {formatPrice(p.lowestPrice || 0)}
                </p>
              </div>
              <ProductStockBadge status={p.availabilityStatus} />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
