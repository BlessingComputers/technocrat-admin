/**
 * Bulk price edit (products and parts lists). The backend has no bulk price
 * endpoint, so the page sends one PATCH per changed item. The backend caps
 * each IP at 25 in-flight requests and 120 per minute, hence the batch cap
 * and the small concurrency.
 */

/** Most items one bulk price page takes. */
export const BULK_PRICE_MAX_ITEMS = 50;

/** Requests the page keeps in flight at once (loads and saves). */
export const BULK_PRICE_CONCURRENCY = 4;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The page's `?ids=` param → unique DB UUIDs, capped. Non-UUIDs are dropped:
 * each id goes into a request path.
 */
export function parseBulkPriceIds(param: string | null): string[] {
  const ids = (param ?? "").split(",").filter((id) => UUID.test(id));
  return [...new Set(ids)].slice(0, BULK_PRICE_MAX_ITEMS);
}

export interface PriceAdjustment {
  mode: "percent" | "amount";
  /** Percent (5 = +5%) or naira amount; negative lowers the price. */
  value: number;
  /** Round the result to the nearest multiple of this (1 = no rounding). */
  roundTo: number;
}

/** The "fill all" math: adjust, round to the step, floor at 0. */
export function adjustPrice(price: number, adj: PriceAdjustment): number {
  const raw =
    adj.mode === "percent" ? price * (1 + adj.value / 100) : price + adj.value;
  const step = adj.roundTo > 0 ? adj.roundTo : 1;
  return Math.max(0, Math.round(raw / step) * step);
}

/**
 * Compare drafts (naira strings, e.g. "₦110 000") with current prices.
 * Blank, missing or unchanged drafts are no change; a draft of 0 is invalid.
 */
export function pendingPriceChanges(
  rows: ReadonlyArray<{ key: string; current: number | null }>,
  drafts: Readonly<Record<string, string>>,
): { changes: Array<{ key: string; price: number }>; invalid: string[] } {
  const changes: Array<{ key: string; price: number }> = [];
  const invalid: string[] = [];
  for (const row of rows) {
    const digits = (drafts[row.key] ?? "").replace(/\D/g, "");
    if (!digits) continue;
    const price = Number(digits);
    if (price <= 0) invalid.push(row.key);
    else if (price !== row.current) changes.push({ key: row.key, price });
  }
  return { changes, invalid };
}

/** Promise.allSettled with at most `limit` workers in flight. Keeps order. */
export async function runLimited<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await worker(items[i]) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}
