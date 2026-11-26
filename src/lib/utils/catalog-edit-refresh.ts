import type { QueryClient } from "@tanstack/react-query";

import { PRICE_AGE_QUERY_KEY } from "./price-age";

/**
 * Query-key roots of the pages fed by the backend's catalog edit log: the
 * uploads pages (counts, item lists, quick-look sheet) and rewards. They live
 * here, not in their features, so product and part edits can refresh them.
 */
export const ANALYTICS_QUERY_KEY = ["analytics"] as const;
export const REWARDS_QUERY_KEY = ["rewards"] as const;

/**
 * After a staff edit to a product or part: the backend logs it (uploader
 * credit) and, for a price change, moves `priceCheckedAt`. Marks the pages
 * that show those as stale, so they refetch when next shown.
 */
export function refreshCatalogEditViews(queryClient: QueryClient) {
  for (const queryKey of [PRICE_AGE_QUERY_KEY, ANALYTICS_QUERY_KEY, REWARDS_QUERY_KEY]) {
    queryClient.invalidateQueries({ queryKey });
  }
}
