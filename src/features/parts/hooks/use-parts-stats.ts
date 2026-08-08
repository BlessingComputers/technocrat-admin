"use client";

import { useParts, usePartTypes } from "../api/parts.queries";

/**
 * Lightweight stats for the parts hub strip. There's no parts-stats endpoint, so
 * the totals come from cheap `limit: 1` list calls (we only read `meta.total`)
 * plus the part-types count. Out-of-stock is derived. These are global (unfiltered
 * by the table's current filters) and cached independently by React Query.
 */
export function usePartsStats() {
  const total = useParts({ limit: 1 });
  const inStock = useParts({ limit: 1, isInStock: true });
  const types = usePartTypes();

  const totalCount = total.data?.meta.total ?? 0;
  const inStockCount = inStock.data?.meta.total ?? 0;

  return {
    total: totalCount,
    inStock: inStockCount,
    outOfStock: Math.max(0, totalCount - inStockCount),
    partTypes: types.data?.length ?? 0,
    isLoading: total.isLoading || inStock.isLoading || types.isLoading,
  };
}
