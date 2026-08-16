"use client";

import Link from "next/link";

import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { useProducts } from "../api/products.queries";
import { ProductStockBadge } from "./product-stock-badge";
import { RecentProductsSnapshotSkeleton } from "./products-skeletons";

const SNAPSHOT_LIMIT = 5;

/**
 * Read-only "recently added" list for the products hub. A glanceable snapshot —
 * thumbnail · name · price · stock — where each row links to the product detail.
 * The full working list (sort headers, row actions) lives at `/catalogues/all`.
 */
export function RecentProductsSnapshot() {
  const { data, isLoading, isError } = useProducts({
    sortKey: "newest",
    sortDir: "desc",
    limit: SNAPSHOT_LIMIT,
  });

  const products = data?.data ?? [];

  if (isLoading) {
    return <RecentProductsSnapshotSkeleton />;
  }

  if (isError) {
    return (
      <div className="px-4 py-8 text-center text-xs font-medium text-muted-foreground">
        Couldn’t load recent products
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <AppIcon icon="solar:box-linear" className="size-8 opacity-30" />
        <span className="text-xs font-medium text-muted-foreground">
          No products yet
        </span>
        <Link
          href="/catalogues/new"
          className="text-xs font-medium text-primary-ink hover:underline"
        >
          Add your first product →
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/catalogues/${p.id}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
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
            <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
            <p className="font-mono text-xs font-medium tabular-nums text-muted-foreground">
              {formatPrice(p.lowestPrice || 0)}
            </p>
          </div>
          <ProductStockBadge status={p.availabilityStatus} />
        </Link>
      ))}
    </div>
  );
}
