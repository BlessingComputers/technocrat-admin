// Turning a deal target's ids into something a person can read.
//
// A target stores ids and nothing else, and a DRAFT has no rules to borrow
// names from — so a label has to be assembled from whatever is on hand.

import type { DealTaxonomyOption } from "../api/deals.service";
import type { DealTarget } from "../types/deals";

/** The name lists a label can be resolved against. All optional. */
export interface DealScopeNames {
  categories?: DealTaxonomyOption[];
  brands?: DealTaxonomyOption[];
  partTypes?: DealTaxonomyOption[];
}

/**
 * A human label for one target.
 *
 * Taxonomy ids resolve against the lists the caller passes, so a renamed
 * category shows its new name. An exact product or part cannot: the catalogue
 * is too big to hold in memory and there is no bulk id lookup, so the form
 * writes the chosen item's name into the target's `notes` when it is created
 * and this reads it back.
 *
 * That is a display convenience, not an identity. Nothing groups, matches or
 * counts on `notes` — the deal's own id does all of that — so a staff member
 * editing the note on the rule the target became breaks a label and nothing
 * else.
 */
export function targetScopeLabel(
  target: DealTarget,
  names: DealScopeNames = {},
): string {
  const isPart = target.entityType === "part";

  if (target.productId || target.partId) {
    const captured = target.notes?.trim();
    if (captured) return captured;
    return isPart ? "One specific part" : "One specific product";
  }

  const parts: string[] = [];
  const category = lookup(names.categories, target.categoryId);
  const brand = lookup(names.brands, target.brandId);
  const partType = lookup(names.partTypes, target.partTypeId);

  if (brand) parts.push(brand);
  if (partType) parts.push(partType);
  if (category) parts.push(category);

  if (parts.length === 0) {
    // Every taxonomy axis left wide open — legal, and the widest scope there
    // is. Say so rather than rendering an empty cell.
    return isPart ? "All parts" : "All products";
  }
  return parts.join(" · ");
}

function lookup(
  options: DealTaxonomyOption[] | undefined,
  id: string | undefined,
): string | null {
  if (!id) return null;
  const hit = options?.find((o) => o.id === id);
  // An id with no match is a category or brand that was deleted after the deal
  // was written. Show that it is gone rather than an empty string.
  return hit?.name ?? "Deleted";
}

/** "Product" / "Part", for a column that has to say which catalogue. */
export function entityLabel(target: DealTarget): string {
  return target.entityType === "part" ? "Part" : "Product";
}

/** How many targets point at each catalogue: "8 products · 3 parts". */
export function targetMixLabel(targets: DealTarget[]): string {
  const products = targets.filter((t) => t.entityType === "product").length;
  const parts = targets.length - products;
  const bits: string[] = [];
  if (products) bits.push(`${products} product${products === 1 ? "" : "s"}`);
  if (parts) bits.push(`${parts} part${parts === 1 ? "" : "s"}`);
  return bits.join(" · ") || "no targets";
}
