import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { partsPricingService } from "./pricing.service";
import type {
  PartMarkupApplyInput,
  PartMarkupPreviewInput,
  PartMarkupRuleInput,
  PartMarkupRuleUpdateInput,
} from "../types/pricing";

export const partPricingKeys = {
  rules: ["part-markup-rules"] as const,
  partSearch: (term: string) =>
    ["part-markup-rules", "part-search", term] as const,
};

export function usePartMarkupRules() {
  return useQuery({
    queryKey: partPricingKeys.rules,
    queryFn: () => partsPricingService.getMarkupRules(),
  });
}

/**
 * Type-ahead search for the exact-part rule scope. Disabled below two
 * characters so an empty picker never pulls the whole catalog; the caller
 * debounces the term before handing it over.
 */
export function usePartMarkupPartSearch(term: string) {
  const query = term.trim();
  return useQuery({
    queryKey: partPricingKeys.partSearch(query),
    queryFn: () => partsPricingService.searchParts(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useCreatePartMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PartMarkupRuleInput) =>
      partsPricingService.createMarkupRule(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: partPricingKeys.rules }),
  });
}

export function useUpdatePartMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PartMarkupRuleUpdateInput;
    }) => partsPricingService.updateMarkupRule(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: partPricingKeys.rules }),
  });
}

export function useDeletePartMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partsPricingService.deleteMarkupRule(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: partPricingKeys.rules }),
  });
}

export function usePreviewPartMarkup() {
  return useMutation({
    mutationFn: (input: PartMarkupPreviewInput) =>
      partsPricingService.previewMarkup(input),
  });
}

export function useApplyPartMarkup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PartMarkupApplyInput) =>
      partsPricingService.applyMarkup(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: partPricingKeys.rules }),
  });
}

export function useResetPartMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      partsPricingService.resetMarkupRule(ruleId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: partPricingKeys.rules }),
  });
}

export function useCancelPartMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      partsPricingService.cancelMarkupRule(ruleId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: partPricingKeys.rules }),
  });
}
