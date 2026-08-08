import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { promotionsService } from "./promotions.service";
import type {
  CreatePromotionInput,
  PromotionsListParams,
  SlideUploadMetadata,
  UpdatePromotionInput,
  UpdateSlideInput,
} from "../types/promotions";

export const promotionsKeys = {
  all: ["promotions"] as const,
  list: (params: PromotionsListParams) =>
    [...promotionsKeys.all, "list", params] as const,
  detail: (id: string) => [...promotionsKeys.all, "detail", id] as const,
};

export function usePromotions(params: PromotionsListParams = {}) {
  return useQuery({
    queryKey: promotionsKeys.list(params),
    queryFn: () => promotionsService.list(params),
  });
}

export function usePromotionById(id: string) {
  return useQuery({
    queryKey: promotionsKeys.detail(id),
    queryFn: () => promotionsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePromotionInput) => promotionsService.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: promotionsKeys.all }),
  });
}

export function useUpdatePromotion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePromotionInput) =>
      promotionsService.update(id, data),
    onSuccess: (promotion) => {
      queryClient.setQueryData(promotionsKeys.detail(id), promotion);
      queryClient.invalidateQueries({ queryKey: promotionsKeys.all });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => promotionsService.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: promotionsKeys.all }),
  });
}

export function usePublishPromotion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => promotionsService.publish(id),
    onSuccess: (promotion) => {
      queryClient.setQueryData(promotionsKeys.detail(id), promotion);
      queryClient.invalidateQueries({ queryKey: promotionsKeys.all });
    },
  });
}

export function useArchivePromotion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => promotionsService.archive(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: promotionsKeys.all }),
  });
}

export function useUploadSlides(promotionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      files,
      metadata,
    }: {
      files: File[];
      metadata: SlideUploadMetadata[];
    }) => promotionsService.uploadSlides(promotionId, files, metadata),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: promotionsKeys.detail(promotionId),
      }),
  });
}

export function useUpdateSlide(promotionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slideId,
      data,
    }: {
      slideId: string;
      data: UpdateSlideInput;
    }) => promotionsService.updateSlide(promotionId, slideId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: promotionsKeys.detail(promotionId),
      }),
  });
}

/** Product search for a slide's link picker. Mirrors useTaxProductSearch. */
export function usePromotionProductSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: [...promotionsKeys.all, "product-search", trimmed],
    queryFn: () => promotionsService.searchProducts(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });
}

export function useDeleteSlide(promotionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slideId: string) =>
      promotionsService.deleteSlide(promotionId, slideId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: promotionsKeys.detail(promotionId),
      }),
  });
}
