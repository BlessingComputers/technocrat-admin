import type { ProductCategory } from "../types/products";

/**
 * A product carries exactly ONE category foreign key. A subcategory is just a
 * Category row with a `parentId`, so a product filed under "Workstations" comes
 * back with `categoryId` pointing at Workstations and no parent link anywhere in
 * the payload. Splitting that flat id back into the parent/child pair the UI
 * shows can only be done against the category tree from `useCategories()`.
 */
export interface CategorySplit {
  /** Top-level category. Undefined until the tree has loaded. */
  parent?: ProductCategory;
  /** Only set when `categoryId` pointed at a subcategory. */
  child?: ProductCategory;
}

/** Children come back as full objects; the type also allows bare ids. */
function childCategories(category: ProductCategory): ProductCategory[] {
  return (category.children ?? []).filter(
    (child): child is ProductCategory => typeof child !== "string",
  );
}

/**
 * Resolve a product's flat `categoryId` into the parent + subcategory pair.
 *
 * Returns an empty split while the tree is still loading, so callers can tell
 * "not resolved yet" from "resolved to a top-level category" and avoid latching
 * a half-loaded answer.
 */
export function splitCategoryId(
  categoryId: string | undefined,
  categories: ProductCategory[],
): CategorySplit {
  if (!categoryId || categories.length === 0) return {};

  for (const category of categories) {
    if (category.id === categoryId) return { parent: category };

    const child = childCategories(category).find((c) => c.id === categoryId);
    if (child) return { parent: category, child };
  }

  // Filed under a category the tree doesn't list (inactive, or deeper than the
  // two levels this endpoint returns). Better to report nothing than to guess.
  return {};
}
