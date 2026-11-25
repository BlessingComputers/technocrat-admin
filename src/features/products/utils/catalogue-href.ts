/**
 * Link into the catalogue list filtered by one category or brand slug. The list
 * reads both from the URL (`useProductFilters`), and a parent category's slug
 * also matches its subcategories (the backend expands descendants).
 */
export function catalogueHref(filter: { category: string } | { brand: string }): string {
  return `/catalogues/all?${new URLSearchParams(filter).toString()}`;
}
