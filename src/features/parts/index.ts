// Public API of the parts feature.
// Export ONLY what routes or other layers need. Everything else stays internal.

// Views consumed by route pages (uncomment as each slice lands):
export { PartsBrowseView } from "./components/parts-browse-view";
export { PartFormView } from "./components/part-form-view";
export { PartDetailView } from "./components/part-detail-view";
export { ProductPartsPanel } from "./components/product-parts-panel";
export { BulkPartsView } from "./components/bulk-parts-view";
export { PartTypesView } from "./components/part-types-view";
export { PartsPricingView } from "./components/pricing/parts-pricing-view";

// Loading skeletons shared with route-level loading.tsx files.
export {
  PartsTableSkeleton,
  PartDetailSkeleton,
  PartFormSkeleton,
  PartsMarkupTableSkeleton,
} from "./components/parts-skeletons";
// export { PartDetailView } from "./components/part-detail-view";
// export { PartTypesPanel } from "./components/part-types-panel";
// export { CompatiblePartsSection } from "./components/compatible-parts-section";

// Data foundation (Slice 1) — query hooks pages/components call directly.
export {
  partKeys,
  useParts,
  usePart,
  usePartTypes,
  usePartCategories,
  usePartBrands,
  useProductParts,
  useCreatePart,
  useUpdatePart,
  useDeactivatePart,
  usePermanentlyDeletePart,
  useUploadPartImages,
  useDeletePartImage,
  useSetPartPrimaryImage,
  useCreatePartType,
  useLinkPart,
  useBulkLinkParts,
  useReorderProductParts,
  useUpdateProductPartLink,
  useUnlinkPart,
} from "./api/parts.queries";

export type {
  Part,
  PartDetail,
  PartType,
  PartImage,
  PartSpecification,
  ProductPartLink,
  PartsByCategory,
  PartsListParams,
  PartsListEnvelope,
} from "./types/parts";

export {
  partFormSchema,
  toFormDefaults,
  toCreateDto,
  toUpdateDto,
  formatNaira,
  parseNairaNullable,
  slugify,
} from "./schemas/part-form";
export type { PartFormValues } from "./schemas/part-form";
