import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { partsPricingService } from "./pricing.service";
import {
  isPartRuleAtTarget,
  partRuleTypeOf,
  type PartMarkupApplyInput,
  type PartMarkupPreviewInput,
  type PartMarkupRule,
  type PartMarkupRuleInput,
  type PartMarkupRuleTarget,
  type PartMarkupRuleType,
  type PartMarkupRuleUpdateInput,
} from "../types/pricing";

export const partPricingKeys = {
  /**
   * Prefix over every list variant, filtered or not. Every mutation below
   * invalidates with THIS, so a write refreshes the Markup list and the Deals
   * list together. Kept as a flat array under its old name because it is
   * already the invalidation prefix at six call sites; the products key
   * factory spells the same idea as `all` + `lists()`.
   */
  rules: ["part-markup-rules"] as const,
  /** One list variant. `undefined` is the unfiltered list. */
  list: (type?: PartMarkupRuleType) =>
    ["part-markup-rules", "list", type ?? "all"] as const,
  partSearch: (term: string) =>
    ["part-markup-rules", "part-search", term] as const,
};

/**
 * Client-side twin of the `?type=` filter, defined once at module scope so the
 * `select` reference stays stable across renders.
 *
 * The server filter only exists from `2f01924`, which prod's `main` predates —
 * point an admin at DigitalOcean and `?type=markup` comes back as every rule,
 * deals included. Re-filtering here means the Markup screen shows markups and
 * the Deals screen shows deals against both backends. `partRuleTypeOf` covers
 * the other half of the same gap: prod sends no `ruleType` either.
 */
const RULE_TYPE_FILTER: Record<
  PartMarkupRuleType,
  (rules: PartMarkupRule[]) => PartMarkupRule[]
> = {
  MARKUP: (rules) => rules.filter((r) => partRuleTypeOf(r) === "MARKUP"),
  DISCOUNT: (rules) => rules.filter((r) => partRuleTypeOf(r) === "DISCOUNT"),
};

/** Pass a type to have the server filter; omit it for every rule. */
export function usePartMarkupRules(type?: PartMarkupRuleType) {
  return useQuery({
    queryKey: partPricingKeys.list(type),
    queryFn: () => partsPricingService.getMarkupRules(type),
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
 * It is the only real protection on the markup side. `createPartMarkupRule`
 * does refuse a duplicate scope, but with a plain `Error` that the backend's
 * handler turns into an untyped 500 (ask 27), so there is no server answer
 * worth catching there. The deals side gets a typed 409 as a second line; this
 * is still its first.
 *
 * Scope-only, and matched exactly — an inactive rule counts, because the
 * backend's duplicate check ignores `isActive` too.
 */
export function usePartRuleAtTarget(target: PartMarkupRuleTarget | null) {
  const hasTarget = !!(
    target &&
    (target.partId || target.categoryId || target.brandId || target.partTypeId)
  );
  const { data: rules, isFetching } = useQuery({
    queryKey: partPricingKeys.list(),
    queryFn: () => partsPricingService.getMarkupRules(),
    enabled: hasTarget,
  });

  return {
    rule: hasTarget
      ? (rules?.find((r) => isPartRuleAtTarget(r, target)) ?? null)
      : null,
    /** True only while the answer is still unknown — never on a refetch. */
    isChecking: hasTarget && !rules && isFetching,
  };
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
