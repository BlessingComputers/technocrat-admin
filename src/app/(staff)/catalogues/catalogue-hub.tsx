"use client";

import { ProductsHubView } from "@/features/products";
import { PartsStatsBar, usePartsStats } from "@/features/parts";

/**
 * Route-level composition for the catalogue hub (`/catalogues`).
 *
 * The hub reports on products AND parts, and a feature may not import a sibling
 * feature (boundaries rule) — only `app/` may depend on more than one. So this
 * thin client shell reads the parts numbers from the parts feature and hands
 * them to the products feature's hub layout, the same way `PricingWorkspace`
 * composes the products, parts, and tax slices into one route.
 */
export function CatalogueHub() {
  const partsStats = usePartsStats();

  return (
    <ProductsHubView
      partsStats={partsStats}
      partsStatsBar={
        <PartsStatsBar
          total={partsStats.total}
          inStock={partsStats.inStock}
          outOfStock={partsStats.outOfStock}
          partTypes={partsStats.partTypes}
          isLoading={partsStats.isLoading}
        />
      }
    />
  );
}
