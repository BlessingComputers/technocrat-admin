import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taxService } from "./tax.service";
import type {
  PartTaxRuleInput,
  TaxRuleInput,
  TaxRuleUpdateInput,
  TaxSettingInput,
} from "../types/tax";

// ── Query keys ─────────────────────────────────────────────────────────

export const taxKeys = {
  all: ["tax"] as const,
  setting: () => [...taxKeys.all, "setting"] as const,
  rules: () => [...taxKeys.all, "rules"] as const,
  partRules: () => [...taxKeys.all, "part-rules"] as const,
  taxonomy: () => [...taxKeys.all, "taxonomy"] as const,
  categories: () => [...taxKeys.taxonomy(), "categories"] as const,
  brands: () => [...taxKeys.taxonomy(), "brands"] as const,
  partTypes: () => [...taxKeys.taxonomy(), "part-types"] as const,
  productSearch: (query: string) =>
    [...taxKeys.all, "product-search", query] as const,
  partSearch: (query: string) =>
    [...taxKeys.all, "part-search", query] as const,
};

// Taxonomy rarely changes within a session — cache it for a few minutes so the
// scope selects don't refetch on every dialog open.
const TAXONOMY_STALE_MS = 5 * 60_000;

// ── Store-wide setting ─────────────────────────────────────────────────

export function useTaxSetting() {
  return useQuery({
    queryKey: taxKeys.setting(),
    queryFn: () => taxService.getSetting(),
  });
}

export function useUpdateTaxSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TaxSettingInput) => taxService.updateSetting(data),
    // The PUT returns the fresh setting — seed it so the panel reflects the
    // saved state without a refetch round-trip.
    onSuccess: (setting) => queryClient.setQueryData(taxKeys.setting(), setting),
  });
}

// ── Product tax rules ──────────────────────────────────────────────────

export function useTaxRules() {
  return useQuery({
    queryKey: taxKeys.rules(),
    queryFn: () => taxService.getRules(),
  });
}

export function useCreateTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TaxRuleInput) => taxService.createRule(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxKeys.rules() }),
  });
}

export function useUpdateTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaxRuleUpdateInput }) =>
      taxService.updateRule(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxKeys.rules() }),
  });
}

export function useDeleteTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxService.deleteRule(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxKeys.rules() }),
  });
}

// ── Part tax rules ─────────────────────────────────────────────────────

export function usePartTaxRules() {
  return useQuery({
    queryKey: taxKeys.partRules(),
    queryFn: () => taxService.getPartRules(),
  });
}

export function useCreatePartTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PartTaxRuleInput) => taxService.createPartRule(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxKeys.partRules() }),
  });
}

export function useUpdatePartTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaxRuleUpdateInput }) =>
      taxService.updatePartRule(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxKeys.partRules() }),
  });
}

export function useDeletePartTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxService.deletePartRule(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxKeys.partRules() }),
  });
}

// ── Taxonomy (scope selects) ───────────────────────────────────────────

export function useTaxCategories() {
  return useQuery({
    queryKey: taxKeys.categories(),
    queryFn: () => taxService.getCategories(),
    staleTime: TAXONOMY_STALE_MS,
  });
}

export function useTaxBrands() {
  return useQuery({
    queryKey: taxKeys.brands(),
    queryFn: () => taxService.getBrands(),
    staleTime: TAXONOMY_STALE_MS,
  });
}

export function useTaxPartTypes() {
  return useQuery({
    queryKey: taxKeys.partTypes(),
    queryFn: () => taxService.getPartTypes(),
    staleTime: TAXONOMY_STALE_MS,
  });
}

// Product search for the exact-product scope. Only fires once the query has a
// couple of characters — an unfiltered catalog dump isn't useful in a picker —
// and results stay briefly fresh so re-opening the same search doesn't refetch.
export function useTaxProductSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: taxKeys.productSearch(trimmed),
    queryFn: () => taxService.searchProducts(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });
}

/** Part search for the exact-part scope — mirrors useTaxProductSearch. */
export function useTaxPartSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: taxKeys.partSearch(trimmed),
    queryFn: () => taxService.searchParts(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });
}
