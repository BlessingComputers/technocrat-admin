import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pricingService } from "./pricing.service";
import { productKeys } from "./products.queries";
import {
  isRuleAtTarget,
  ruleTypeOf,
  type MarkupApplyInput,
  type MarkupPreviewInput,
  type MarkupRule,
  type MarkupRuleInput,
  type MarkupRuleTarget,
  type MarkupRuleType,
  type MarkupRuleUpdateInput,
  type ResetCategoryInput,
} from "../types/pricing";

// ── Query keys ─────────────────────────────────────────────────────────

export const markupRuleKeys = {
  all: ["markup-rules"] as const,
  /**
   * Prefix over every list variant, filtered or not. Invalidate with THIS, not
   * with `list()` — a mutation has to refresh both the Markup list and the
   * Deals list, and starting a deal at a scope can change what the other one
   * shows.
   */
  lists: () => [...markupRuleKeys.all, "list"] as const,
  /** One list variant. `undefined` is the unfiltered list. */
  list: (type?: MarkupRuleType) =>
    [...markupRuleKeys.lists(), type ?? "all"] as const,
  detail: (id: string) => [...markupRuleKeys.all, "detail", id] as const,
  productSearch: (term: string) =>
    [...markupRuleKeys.all, "product-search", term] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

/**
 * Client-side twin of the `?type=` filter, defined once at module scope so the
 * `select` reference stays stable across renders.
 *
 * The server filter only exists from `2f01924`, which prod's `main` predates —
 * point an admin at DigitalOcean and `?type=markup` comes back as every rule,
 * deals included. Re-filtering here means the Markup screen shows markups and
 * the Deals screen shows deals against both backends. `ruleTypeOf` covers the
 * other half of the same gap: prod sends no `ruleType` either.
 */
const RULE_TYPE_FILTER: Record<
  MarkupRuleType,
  (rules: MarkupRule[]) => MarkupRule[]
> = {
  MARKUP: (rules) => rules.filter((r) => ruleTypeOf(r) === "MARKUP"),
  DISCOUNT: (rules) => rules.filter((r) => ruleTypeOf(r) === "DISCOUNT"),
};

/** Pass a type to have the server filter; omit it for every rule. */
export function useMarkupRules(type?: MarkupRuleType) {
  return useQuery({
    queryKey: markupRuleKeys.list(type),
    queryFn: () => pricingService.getMarkupRules(type),
    select: type ? RULE_TYPE_FILTER[type] : undefined,
  });
}

/**
 * The rule sitting on exactly this target, whichever half it belongs to.
 *
 * Both pricing screens hide the other half's rules, so each one can destroy a
 * rule it never showed: saving a markup over a running deal ends the sale, and
 * vice versa. This is what each form's pre-flight clash warning reads, so it
 * deliberately queries the UNFILTERED list.
 *
 * It is the only real protection on the markup side. `createRule` does refuse a
 * duplicate scope, but with a plain `Error` that the backend's handler turns
 * into an untyped 500 (ask 27), so there is no server answer worth catching
 * there. The deals side gets a typed 409 as a second line; this is still its
 * first.
 *
 * Scope-only, and matched exactly — an inactive rule counts, because the
 * backend's duplicate check ignores `isActive` too.
 */
export function useRuleAtTarget(target: MarkupRuleTarget | null) {
  const hasTarget = !!(
    target &&
    (target.productId || target.categoryId || target.brandId)
  );
  const { data: rules, isFetching } = useQuery({
    queryKey: markupRuleKeys.list(),
    queryFn: () => pricingService.getMarkupRules(),
    enabled: hasTarget,
  });

  return {
    rule: hasTarget
      ? (rules?.find((r) => isRuleAtTarget(r, target)) ?? null)
      : null,
    /** True only while the answer is still unknown — never on a refetch. */
    isChecking: hasTarget && !rules && isFetching,
  };
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
      // Prices changed in bulk — the product lists (and the KPI counts
      // derived from them) are now stale.
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Cancel a rule: deactivates it and resets all in-scope prices to base. Because
 * the rule flips to inactive AND prices change, invalidate both the rule
 * caches and the product lists (which the KPI counts are derived from).
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
    },
  });
}

/**
 * Reset prices to base but keep the rule active. The rule's isActive doesn't
 * change, so only the product lists are invalidated (not the rule caches).
 */
export function useResetMarkupRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => pricingService.resetMarkupRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Reset a category (optionally one brand) to base, no rule involved. Affects
 * only prices, so invalidate the product lists.
 */
export function useResetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResetCategoryInput) =>
      pricingService.resetCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
