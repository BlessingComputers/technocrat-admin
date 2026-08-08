import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { partsService } from "./parts.service";
import { partTaxonomyService } from "./taxonomy.service";
import type {
  BulkCreatePartsDto,
  BulkEditPartsInput,
  BulkLinkPartsDto,
  CreatePartDto,
  CreatePartTypeDto,
  DeletePartImageDto,
  LinkPartDto,
  PartsListParams,
  ReorderPartsDto,
  UpdatePartDto,
  UpdatePartLinkDto,
} from "../types/parts";

// ── Query keys ─────────────────────────────────────────────────────────

export const partKeys = {
  all: ["parts"] as const,
  lists: () => [...partKeys.all, "list"] as const,
  list: (filters: PartsListParams) =>
    [...partKeys.lists(), filters] as const,
  detail: (id: string) => [...partKeys.all, "detail", id] as const,
  types: ["part-types"] as const,
  categories: ["part-categories"] as const,
  brands: ["part-brands"] as const,
  productParts: (productId: string) =>
    ["product-parts", productId] as const,
  bulkBatch: (batchId: string) =>
    [...partKeys.all, "bulk-batch", batchId] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

export function useParts(
  filters: PartsListParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: partKeys.list(filters),
    queryFn: () => partsService.getParts(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function usePart(partId?: string) {
  return useQuery({
    queryKey: partKeys.detail(partId || ""),
    queryFn: () => partsService.getPart(partId!),
    enabled: !!partId,
  });
}

export function usePartTypes() {
  return useQuery({
    queryKey: partKeys.types,
    queryFn: () => partsService.getPartTypes(),
  });
}

export function usePartCategories() {
  return useQuery({
    queryKey: partKeys.categories,
    queryFn: () => partTaxonomyService.getCategories(),
  });
}

export function usePartBrands() {
  return useQuery({
    queryKey: partKeys.brands,
    queryFn: () => partTaxonomyService.getBrands(),
  });
}

export function useProductParts(productId?: string) {
  return useQuery({
    queryKey: partKeys.productParts(productId || ""),
    queryFn: () => partsService.getProductParts(productId!),
    enabled: !!productId,
  });
}

// ── Part mutations ─────────────────────────────────────────────────────

export function useCreatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePartDto) => partsService.createPart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partKeys.lists() });
    },
  });
}

export function useUpdatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartDto }) =>
      partsService.updatePart(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: partKeys.detail(variables.id),
      });
    },
  });
}

export function useDeactivatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partsService.deactivatePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partKeys.lists() });
    },
  });
}

export function usePermanentlyDeletePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partsService.permanentlyDeletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partKeys.lists() });
    },
  });
}

export function useBulkEditParts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkEditPartsInput) => partsService.bulkEditParts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partKeys.lists() });
    },
  });
}

export function useBulkDeleteParts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (partIds: string[]) => partsService.bulkDeleteParts(partIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partKeys.lists() });
    },
  });
}

// ── Part image mutations ───────────────────────────────────────────────

export function useUploadPartImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      partId,
      files,
      onProgress,
    }: {
      partId: string;
      files: File[];
      onProgress?: (completed: number, total: number) => void;
    }) => partsService.uploadPartImages(partId, files, onProgress),
    // Settle (not just success): one request per image, so a mid-batch failure
    // can still leave earlier images persisted — refetch to reflect reality.
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: partKeys.detail(variables.partId),
      });
      queryClient.invalidateQueries({ queryKey: partKeys.lists() });
    },
  });
}

export function useDeletePartImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      partId,
      imageId,
      body,
    }: {
      partId: string;
      imageId: string;
      body: DeletePartImageDto;
    }) => partsService.deletePartImage(partId, imageId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partKeys.detail(variables.partId),
      });
    },
  });
}

export function useSetPartPrimaryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partId, imageId }: { partId: string; imageId: string }) =>
      partsService.setPartPrimaryImage(partId, imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partKeys.detail(variables.partId),
      });
      queryClient.invalidateQueries({ queryKey: partKeys.lists() });
    },
  });
}

// ── Bulk create ────────────────────────────────────────────────────────

export function useBulkUploadPartImages() {
  return useMutation({
    mutationFn: (files: { file: File; key: string }[]) =>
      partsService.bulkUploadPartImages(files),
  });
}

export function useBulkCreateParts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreatePartsDto) =>
      partsService.bulkCreateParts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partKeys.lists() });
    },
  });
}

export function usePartBulkBatchStatus(batchId: string | null) {
  return useQuery({
    queryKey: partKeys.bulkBatch(batchId || ""),
    queryFn: () => partsService.getPartBulkBatchStatus(batchId!),
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

// ── Part type mutations (create only — PATCH/DELETE pending backend) ───

export function useCreatePartType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePartTypeDto) =>
      partsService.createPartType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partKeys.types });
    },
  });
}

// ── Product↔part link mutations ────────────────────────────────────────

export function useLinkPart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: LinkPartDto }) =>
      partsService.linkPart(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partKeys.productParts(variables.productId),
      });
    },
  });
}

export function useBulkLinkParts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: BulkLinkPartsDto;
    }) => partsService.bulkLinkParts(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partKeys.productParts(variables.productId),
      });
    },
  });
}

export function useReorderProductParts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: ReorderPartsDto;
    }) => partsService.reorderProductParts(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partKeys.productParts(variables.productId),
      });
    },
  });
}

export function useUpdateProductPartLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      partId,
      data,
    }: {
      productId: string;
      partId: string;
      data: UpdatePartLinkDto;
    }) => partsService.updateProductPartLink(productId, partId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partKeys.productParts(variables.productId),
      });
    },
  });
}

export function useUnlinkPart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, partId }: { productId: string; partId: string }) =>
      partsService.unlinkPart(productId, partId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: partKeys.productParts(variables.productId),
      });
    },
  });
}
