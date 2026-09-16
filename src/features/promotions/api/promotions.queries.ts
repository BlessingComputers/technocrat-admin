import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { promotionsService } from "./promotions.service";
import { fetchStorefrontPages } from "./storefront-pages.client";
import type {
  CreatePromotionInput,
  PromotionReorderEntry,
  PromotionsListParams,
  ReplaceSlideImagesInput,
  SlideUpload,
  UpdatePromotionInput,
  UpdateSlideInput,
} from "../types/promotions";

export const promotionsKeys = {
  all: ["promotions"] as const,
  list: (params: PromotionsListParams) =>
    [...promotionsKeys.all, "list", params] as const,
  detail: (id: string) => [...promotionsKeys.all, "detail", id] as const,
  categories: ["promotions", "categories"] as const,
  brands: ["promotions", "brands"] as const,
  storefrontPages: ["promotions", "storefront-pages"] as const,
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

/**
 * Bulk placement + position write behind the grouped list's drag handle.
 *
 * No optimistic update: the list view holds the dragged order in local state
 * for the duration of the call, so the cards do not jump, and a failure
 * re-reads the server's answer rather than trying to unwind a guess.
 */
export function useReorderPromotions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: PromotionReorderEntry[]) =>
      promotionsService.reorder(entries),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: promotionsKeys.all }),
  });
}

export function useUploadSlides(promotionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // `onProgress` rides in the variables because the upload is several
    // requests, not one: the caller needs to know how many slides actually
    // landed before a failure so it can drop those from its queue instead of
    // re-sending them.
    mutationFn: ({
      uploads,
      onProgress,
    }: {
      uploads: SlideUpload[];
      onProgress?: (completed: number, total: number) => void;
    }) => promotionsService.uploadSlides(promotionId, uploads, onProgress),
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

/** Swap a slide's desktop and/or mobile image without losing its links. */
export function useReplaceSlideImages(promotionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slideId,
      images,
    }: {
      slideId: string;
      images: ReplaceSlideImagesInput;
    }) => promotionsService.replaceSlideImages(promotionId, slideId, images),
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

/**
 * Categories for the targeting picker. Only fetched once a targetable slot is
 * selected, so the create form does not pull the whole tree for a homepage
 * banner that can never use it.
 */
export function usePromotionCategoryOptions(enabled: boolean) {
  return useQuery({
    queryKey: promotionsKeys.categories,
    queryFn: () => promotionsService.listCategoryOptions(),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * Brands for a slide's link picker. Gated the same way the category list is —
 * only fetched once someone actually opens the brand tab, so editing a caption
 * never pulls the brand table.
 */
export function usePromotionBrandOptions(enabled: boolean) {
  return useQuery({
    queryKey: promotionsKeys.brands,
    queryFn: () => promotionsService.listBrandOptions(),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * The storefront pages a slide may link to, asked of the storefront itself.
 *
 * Gated like the category and brand lists — only fetched once someone opens the
 * page tab. Cached for the session: the answer only changes when the storefront
 * deploys, so re-asking on every mount of the editor buys nothing.
 *
 * Never errors. The fetcher degrades to a built-in list, so `data` is always
 * present once resolved and the picker has no error state to render.
 */
export function useStorefrontPages(enabled: boolean) {
  return useQuery({
    queryKey: promotionsKeys.storefrontPages,
    queryFn: fetchStorefrontPages,
    enabled,
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
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
