import type { UpdatedCatalogItem } from "../types/upload-analytics";

/**
 * Helpers for the uploader "updates" credit (backend CatalogEdit log, ask 40).
 * `changedFields` uses the request-DTO field names the backend compares in
 * catalogEdit.service.ts; variant fields arrive under the variant DTO's names.
 */

/** The backend went live on this UTC day; there is no back-fill before it. */
export const UPDATES_COUNTED_FROM = "2026-11-04";

export type UploaderTab = "products" | "parts" | "updates";

const TABS: readonly UploaderTab[] = ["products", "parts", "updates"];

/** The `?tab=` value, or "products" when it is missing or unknown. */
export function parseUploaderTab(value: string | null): UploaderTab {
  return TABS.find((tab) => tab === value) ?? "products";
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  slug: "URL slug",
  description: "Description",
  categoryId: "Category",
  brandId: "Brand",
  isActive: "Active",
  isFeatured: "Featured",
  specifications: "Specs",
  price: "Price",
  compareAtPrice: "Compare-at price",
  costPrice: "Cost price",
  sku: "SKU",
  condition: "Condition",
  sourcingType: "Sourcing",
  stockQuantity: "Stock",
  lowStockThreshold: "Low-stock alert",
  weight: "Weight",
  imageUrl: "Variant image",
  attributes: "Attributes",
  // The backend prefixes these two so they never collide with the product's own.
  "variant.name": "Variant name",
  "variant.isActive": "Variant active",
  partNumber: "Part number",
  partType: "Part type",
  partTypeId: "Part type",
  ownerSku: "Owner SKU",
  isInStock: "In stock",
  sortOrder: "Sort order",
  images: "Images",
};

/** "warrantyMonths" → "Warranty months", for a field added after this map. */
function humanize(field: string): string {
  const words = field.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Readable, de-duplicated labels for an item's changed fields, in input order. */
export function changedFieldLabels(fields: readonly string[]): string[] {
  return [...new Set(fields.map((f) => FIELD_LABELS[f] ?? humanize(f)))];
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "7 uploads + 3 updates": the split behind one daily total. */
export function workSplitLabel(uploads: number, updates: number): string {
  return `${plural(uploads, "upload")} + ${plural(updates, "update")}`;
}

/**
 * The edit page for an updated item, or null when the backend could not find
 * it (it sends `name: ""` for an item deleted since the edit).
 */
export function updatedItemHref(
  item: Pick<UpdatedCatalogItem, "type" | "id" | "name">,
): string | null {
  if (!item.name) return null;
  return item.type === "product"
    ? `/catalogues/${item.id}/edit`
    : `/catalogues/parts/${item.id}/edit`;
}
