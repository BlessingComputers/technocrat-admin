// Display maps shared across the products list, table row, and hub snapshot.
// Backend availability/sourcing codes → Tailwind pill classes and human labels.

export const STOCK_PILL: Record<string, string> = {
  IN_STOCK: "text-success bg-success/12 border-success/25",
  LOW_STOCK: "text-warning bg-warning/12 border-warning/25",
  OUT_OF_STOCK: "text-destructive bg-destructive/12 border-destructive/25",
};

export const STOCK_LABEL: Record<string, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};

export const SOURCE_LABEL: Record<string, string> = {
  INHOUSE: "In-House",
  OUTSOURCED: "Outsourced",
  MIXED: "Mixed",
};
