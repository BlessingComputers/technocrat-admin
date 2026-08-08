// Public API of the products feature.
// Export ONLY what routes or other layers need. Everything else stays internal.

// Views consumed by route pages (uncomment as each slice lands):
export { ProductsHubView } from "./components/products-hub-view";
export { ProductBrowseView } from "./components/product-browse-view";
export { ProductDetailView } from "./components/detail/product-detail-view";
export { ProductFormView } from "./components/product-form-view";
export { ProductTaxonomyView } from "./components/product-taxonomy-view";
export { BulkUploadView } from "./components/bulk-upload-view";
export { MarkupRulesView } from "./components/pricing/markup-rules-view";

// Loading skeletons shared with route-level loading.tsx files.
export {
  ProductsTableSkeleton,
  ProductDetailSkeleton,
  ProductFormSkeleton,
  MarkupRulesTableSkeleton,
  RecentProductsSnapshotSkeleton,
  CategoriesPanelSkeleton,
} from "./components/products-skeletons";

// Query hooks pages call directly (data foundation — Slice 0).
export {
  productKeys,
  useProducts,
  useProductStats,
  useProduct,
  useCategories,
  useSubcategories,
  useBrands,
  useBulkBatchStatus,
  useCreateProduct,
  useUpdateProduct,
  useUpdateProductStatus,
  useDeleteProduct,
  usePermanentlyDeleteProduct,
  useBulkCreateProducts,
  useBulkUploadImages,
  useUploadProductImages,
  useDeleteProductImage,
  useSetProductPrimaryImage,
  useReorderProductImages,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useMoveCategory,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
  useReorderSubcategories,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from "./api/products.queries";
