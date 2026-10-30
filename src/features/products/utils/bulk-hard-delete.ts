import type { BulkHardDeleteProductsResult, HardDeleteSkip } from "../types/products";

const products = (n: number) => `${n} product${n === 1 ? "" : "s"}`;

/** Toast line for a permanent bulk delete. Counts `deleted`, never the selection. */
export function hardDeleteSummary({ deleted, skipped }: BulkHardDeleteProductsResult): string {
  if (deleted === 0) return `Nothing deleted, ${skipped.length} skipped`;
  const done = `Permanently deleted ${products(deleted)}`;
  return skipped.length > 0 ? `${done}, ${skipped.length} skipped` : done;
}

/** Skipped products that still exist, so they can be deactivated instead. */
export function deactivatableIds(skipped: HardDeleteSkip[]): string[] {
  return skipped.filter((s) => s.code !== "PRODUCT_NOT_FOUND").map((s) => s.productId);
}
