/** One misfiled product in the category cleanup list. */
export interface CleanupProduct {
  /** DB UUID, the id bulk edit takes. */
  id: string;
  productId: string;
  name: string;
  /** Slug of the category the product was filed under at snapshot time. */
  from: string;
}

/** A group of products that all move to the same category. */
export interface CleanupBatch {
  id: string;
  /** 1 crosses departments, 2 changes subcategory, 3 leaves a parent. */
  priority: 1 | 2 | 3;
  targetSlug: string;
  title: string;
  why: string;
  products: CleanupProduct[];
}

/** A subcategory that belongs under a different parent. */
export interface CleanupParentMove {
  slug: string;
  parentSlug: string;
  label: string;
}
