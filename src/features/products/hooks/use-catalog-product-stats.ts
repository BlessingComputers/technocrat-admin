"use client";

import { useProducts } from "../api/products.queries";
import { RESTOCK_PREVIEW_LIMIT } from "../constants/product-display";
import type { ProductStats } from "../types/products";

/**
 * Products-only KPI counts, for the catalogue hub and the browse view.
 *
 * `/v1/admin/dashboard` cannot be used for this. Every priced part gets a hidden
 * `BKNG-…` backing Product + variant on the backend, and the dashboard's
 * `totalProducts` / `activeProducts` are raw `product.count()`s while
 * `lowStockVariants` / `outOfStockVariants` count variants — so all four numbers
 * are products AND parts added together. The product LIST endpoint filters
 * `isHidden: false`, which drops those backing rows, so counting through it is
 * the only way to get a true product number without a backend change.
 *
 * Four cheap calls, each read only for `meta.total`:
 *   isActive true + isActive false → total   (the list defaults to active-only)
 *   stock=low / stock=out                     (of active products)
 *
 * The low/out calls deliberately reuse {@link RESTOCK_PREVIEW_LIMIT} — the same
 * limit `ProductsRestockList` asks for — so on the hub, where both render, React
 * Query serves them from one cache entry instead of two.
 */
export function useCatalogProductStats(): ProductStats & { isLoading: boolean } {
  const active = useProducts({ limit: 1, isActive: true });
  const inactive = useProducts({ limit: 1, isActive: false });
  const low = useProducts({ stock: "low", limit: RESTOCK_PREVIEW_LIMIT });
  const out = useProducts({ stock: "out", limit: RESTOCK_PREVIEW_LIMIT });

  const activeCount = active.data?.meta.total ?? 0;
  const inactiveCount = inactive.data?.meta.total ?? 0;
  const lowStock = low.data?.meta.total ?? 0;
  const outOfStock = out.data?.meta.total ?? 0;

  return {
    total: activeCount + inactiveCount,
    active: activeCount,
    lowStock,
    outOfStock,
    needsRestock: lowStock + outOfStock,
    isLoading:
      active.isLoading ||
      inactive.isLoading ||
      low.isLoading ||
      out.isLoading,
  };
}
