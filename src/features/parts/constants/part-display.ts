// Display maps for the parts list/table. Parts expose `isInStock` + a numeric
// `stockQuantity` (no availability enum, no low-stock threshold), so stock state
// is derived here rather than read from a backend code.

export const PART_LOW_STOCK_THRESHOLD = 5;

export type PartStockState = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export function partStockState(
  isInStock: boolean,
  stockQuantity: number,
): PartStockState {
  if (!isInStock || stockQuantity <= 0) return "OUT_OF_STOCK";
  if (stockQuantity <= PART_LOW_STOCK_THRESHOLD) return "LOW_STOCK";
  return "IN_STOCK";
}

export const PART_STOCK_PILL: Record<PartStockState, string> = {
  IN_STOCK: "text-success bg-success/12 border-success/25",
  LOW_STOCK: "text-warning bg-warning/12 border-warning/25",
  OUT_OF_STOCK: "text-destructive bg-destructive/12 border-destructive/25",
};

export const PART_STOCK_LABEL: Record<PartStockState, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};
