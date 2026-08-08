import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/api/error-message";
import { productsService } from "./products.service";
import type {
  BrandInput,
  BulkEditProductsInput,
  CategoryInput,
  CreateProductDto,
  NewProductImage,
  ProductsListParams,
  UpdateProductDto,
  UploadedImageMeta,
} from "../types/products";

// ── Query keys ─────────────────────────────────────────────────────────

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductsListParams) =>
    [...productKeys.lists(), filters] as const,
  stats: () => [...productKeys.all, "stats"] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
  bulkBatch: (batchId: string) =>
    [...productKeys.all, "bulk-batch", batchId] as const,
  categories: ["product-categories"] as const,
  subcategories: ["product-subcategories"] as const,
  brands: ["product-brands"] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

export function useProducts(
  filters: ProductsListParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsService.getProducts(filters),
    placeholderData: keepPreviousData, // avoid flicker between pages/filters
    ...options,
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: () => productsService.getProductsStats(),
  });
}

export function useProduct(productId?: string) {
  return useQuery({
    queryKey: productKeys.detail(productId || ""),
    queryFn: () => productsService.getProduct(productId!),
    enabled: !!productId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: () => productsService.getCategories(),
  });
}

export function useSubcategories(
  categoryId: string,
  params?: { includeInactive?: boolean; depth?: 1 | 2 | 3 },
) {
  return useQuery({
    queryKey: [...productKeys.subcategories, categoryId, params],
    queryFn: () => productsService.getSubcategories(categoryId, params),
    enabled: !!categoryId,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: productKeys.brands,
    queryFn: () => productsService.getBrands(),
  });
}

export function useBulkBatchStatus(batchId: string | null) {
  return useQuery({
    queryKey: productKeys.bulkBatch(batchId || ""),
    queryFn: () => productsService.getBulkBatchStatus(batchId!),
    enabled: !!batchId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      if (query.state.status === "error") return false;
      return 2000;
    },
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      images,
      onProgress,
    }: {
      data: CreateProductDto;
      /** Queued in the form; travel with the create request where they fit. */
      images?: NewProductImage[];
      onProgress?: (completed: number, total: number) => void;
    }) => productsService.createProduct(data, images, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductDto;
    }) => productsService.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
    },
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productsService.updateProductStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function usePermanentlyDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.permanentlyDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useBulkEditProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkEditProductsInput) =>
      productsService.bulkEditProducts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productIds: string[]) =>
      productsService.bulkDeleteProducts(productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useBulkCreateProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      idempotencyKey: string;
      uploadedImages: Record<string, UploadedImageMeta>;
      products: CreateProductDto[];
    }) => productsService.bulkCreateProducts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

export function useBulkUploadImages() {
  return useMutation({
    mutationFn: (files: { file: File; key: string }[]) =>
      productsService.bulkUploadImages(files),
  });
}

export function useUploadProductImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      files,
      onProgress,
    }: {
      productId: string;
      files: File[];
      onProgress?: (completed: number, total: number) => void;
    }) => productsService.uploadProductImages(productId, files, onProgress),
    // Invalidate on settle (not just success): uploads run one request per image,
    // so a mid-batch failure can still leave earlier images persisted — refetch
    // so the gallery reflects whatever actually made it to the backend.
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      imageId,
    }: {
      productId: string;
      imageId: string;
    }) => productsService.deleteProductImage(productId, imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

export function useSetProductPrimaryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      imageId,
    }: {
      productId: string;
      imageId: string;
    }) => productsService.setProductPrimaryImage(productId, imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useReorderProductImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      order,
    }: {
      productId: string;
      order: { imageId: string; sortOrder: number }[];
    }) => productsService.reorderProductImages(productId, order),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

// ── Search / cache maintenance (require search:admin) ───────────────────

export function useReindexProduct() {
  return useMutation({
    mutationFn: (productId: string) =>
      productsService.reindexProduct(productId),
    onSuccess: () => toast.success("Re-index queued for this product"),
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to queue re-index")),
  });
}

export function useSyncCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => productsService.syncCatalog(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Catalog re-sync started — this runs in the background");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to start catalog re-sync")),
  });
}

export function useClearProductCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => productsService.clearProductCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Product cache cleared");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to clear product cache")),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryInput) => productsService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: Partial<CategoryInput>;
    }) => productsService.updateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      productsService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories });
    },
  });
}

export function useMoveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      newParentId,
    }: {
      categoryId: string;
      newParentId: string;
    }) => productsService.moveCategory(categoryId, newParentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories });
    },
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: CategoryInput;
    }) => productsService.createSubcategory(categoryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...productKeys.subcategories, variables.categoryId],
      });
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      subId,
      data,
    }: {
      categoryId: string;
      subId: string;
      data: Partial<CategoryInput>;
    }) => productsService.updateSubcategory(categoryId, subId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...productKeys.subcategories, variables.categoryId],
      });
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      subId,
    }: {
      categoryId: string;
      subId: string;
    }) => productsService.deleteSubcategory(categoryId, subId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...productKeys.subcategories, variables.categoryId],
      });
    },
  });
}

export function useReorderSubcategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      order,
    }: {
      categoryId: string;
      order: { subId: string; sortOrder: number }[];
    }) => productsService.reorderSubcategories(categoryId, order),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...productKeys.subcategories, variables.categoryId],
      });
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BrandInput) => productsService.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.brands });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      brandId,
      data,
    }: {
      brandId: string;
      data: Partial<BrandInput>;
    }) => productsService.updateBrand(brandId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.brands });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (brandId: string) => productsService.deleteBrand(brandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.brands });
    },
  });
}
