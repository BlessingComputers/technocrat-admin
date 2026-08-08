import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pricingService } from "./pricing.service";
import { productKeys } from "./products.queries";
import type {
  MarkupApplyInput,
  MarkupPreviewInput,
  MarkupRuleInput,
  MarkupRuleUpdateInput,
  ResetCategoryInput,
} from "../types/pricing";

// ── Query keys ─────────────────────────────────────────────────────────

export const markupRuleKeys = {
  all: ["markup-rules"] as const,
  lists: () => [...markupRuleKeys.all, "list"] as const,
  detail: (id: string) => [...markupRuleKeys.all, "detail", id] as const,
  productSearch: (term: string) =>
    [...markupRuleKeys.all, "product-search", term] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

export function useMarkupRules() {
  return useQuery({
    queryKey: markupRuleKeys.lists(),
    queryFn: () => pricingService.getMarkupRules(),
  });
}

export function useMarkupRule(id?: string) {
  return useQuery({
    queryKey: markupRuleKeys.detail(id || ""),
    queryFn: () => pricingService.getMarkupRule(id!),
    enabled: !!id,
  });
}

/**
 * Type-ahead search for the exact-product rule scope. Disabled below two
 * characters so an empty picker never pulls the whole catalog; the caller
 * debounces the term before handing it over.
 */
export function useMarkupProductSearch(term: string) {
  const query = term.trim();
  return useQuery({
    queryKey: markupRuleKeys.productSearch(query),
    queryFn: () => pricingService.searchProducts(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useCreateMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkupRuleInput) =>
      pricingService.createMarkupRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: markupRuleKeys.lists() });
    },
  });
}

export function useUpdateMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarkupRuleUpdateInput }) =>
      pricingService.updateMarkupRule(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: markupRuleKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: markupRuleKeys.detail(variables.id),
      });
      // A percentage/applyTo change recomputes variant prices — refresh the
      // product list/stats so the new prices show up there too.
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useDeleteMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pricingService.deleteMarkupRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: markupRuleKeys.lists() });
    },
  });
}

/**
 * Dry-run preview — no cache invalidation (writes nothing). Takes a saved rule
 * (`{ ruleId }`) or an ad-hoc `{ markupPercentage, categoryId/brandId }`.
 */
export function usePreviewMarkupRule() {
  return useMutation({
    mutationFn: (input: MarkupPreviewInput) =>
      pricingService.previewMarkup(input),
  });
}

export function useApplyMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkupApplyInput) => pricingService.applyMarkup(input),
    onSuccess: () => {
      // Prices changed in bulk — product list/stats are now stale.
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

/**
 * Cancel a rule: deactivates it and resets all in-scope prices to base. Because
 * the rule flips to inactive AND prices change, invalidate both the rule
 * caches and the product list/stats.
 */
export function useCancelMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => pricingService.cancelMarkupRule(ruleId),
    onSuccess: (_, ruleId) => {
      queryClient.invalidateQueries({ queryKey: markupRuleKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: markupRuleKeys.detail(ruleId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

/**
 * Reset prices to base but keep the rule active. The rule's isActive doesn't
 * change, so only product prices/stats are invalidated (not the rule caches).
 */
export function useResetMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => pricingService.resetMarkupRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

/**
 * Reset a category (optionally one brand) to base, no rule involved. Affects
 * only prices, so invalidate product list/stats.
 */
export function useResetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResetCategoryInput) =>
      pricingService.resetCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}
