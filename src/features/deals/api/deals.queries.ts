import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { dealsService, type DealsListParams } from "./deals.service";
import type { CreateDealInput, DealStartResponse } from "../types/deals";

// ── Query keys ─────────────────────────────────────────────────────────

export const dealKeys = {
  all: ["deals"] as const,
  lists: () => [...dealKeys.all, "list"] as const,
  /** One page of one list variant. A missing `status` is every status. */
  list: ({ status, page = 1, limit = 20 }: DealsListParams = {}) =>
    [...dealKeys.lists(), status ?? "all", page, limit] as const,
  detail: (id: string) => [...dealKeys.all, "detail", id] as const,
  /**
   * Where the per-target outcome of a start is parked.
   *
   * `results` exists only in the start response — refetching the deal loses it
   * — so the mutation writes it here and the detail page reads it back. Not a
   * query anyone fetches: nothing has a `queryFn`, it is written and read.
   */
  startResult: (id: string) => [...dealKeys.all, "start-result", id] as const,
  itemSearch: (entity: "product" | "part", term: string) =>
    [...dealKeys.all, "item-search", entity, term] as const,
  clashRules: (entity: "product" | "part") =>
    [...dealKeys.all, "clash-rules", entity] as const,
  taxonomy: (kind: "categories" | "brands" | "part-types") =>
    [...dealKeys.all, "taxonomy", kind] as const,
};

/**
 * The other two slices' cache prefixes, as raw strings.
 *
 * Starting or ending a deal rewrites markup-rule rows and moves prices, so both
 * Markup lists go stale. Their key factories live in `features/products` and
 * `features/parts`, which this feature may not import (`boundaries/
 * dependencies`) — so the prefixes are written out here, matching
 * `markupRuleKeys.all` and `partPricingKeys.rules` exactly. If either is
 * renamed, this goes with it; there is no type to catch the drift.
 */
const MARKUP_RULES_PREFIX = ["markup-rules"] as const;
const PART_MARKUP_RULES_PREFIX = ["part-markup-rules"] as const;

// ── Queries ────────────────────────────────────────────────────────────

/**
 * One page of deals, optionally one status of them. Both the page and the
 * status filter are the server's.
 *
 * `keepPreviousData` holds the current page on screen while the next one loads,
 * so paging and switching chips do not flash the skeleton.
 */
export function useDeals(params: DealsListParams = {}) {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => dealsService.getDeals(params),
    placeholderData: keepPreviousData,
  });
}

export function useDeal(id?: string) {
  return useQuery({
    queryKey: dealKeys.detail(id ?? ""),
    queryFn: () => dealsService.getDeal(id!),
    enabled: !!id,
  });
}

/**
 * The per-target outcome of the last start, if it happened in this session.
 *
 * Cache-only: no `queryFn`, so this never fetches and never errors. After a
 * reload it is empty and the detail page falls back to the rule-count
 * shortfall, which is durable.
 */
export function useDealStartResult(id?: string) {
  return useQuery<DealStartResponse | undefined>({
    queryKey: dealKeys.startResult(id ?? ""),
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  }).data;
}

/**
 * Markup rules on one catalogue, unfiltered, for the target builder's clash
 * check. Kept warm for a minute: a twelve-row form asks the same question
 * twelve times.
 */
export function useClashRules(entity: "product" | "part", enabled = true) {
  return useQuery({
    queryKey: dealKeys.clashRules(entity),
    queryFn: () =>
      entity === "product"
        ? dealsService.getProductMarkupRules()
        : dealsService.getPartMarkupRules(),
    enabled,
    staleTime: 60_000,
  });
}

export function useDealCategories() {
  return useQuery({
    queryKey: dealKeys.taxonomy("categories"),
    queryFn: () => dealsService.getCategories(),
    staleTime: 5 * 60_000,
  });
}

export function useDealBrands() {
  return useQuery({
    queryKey: dealKeys.taxonomy("brands"),
    queryFn: () => dealsService.getBrands(),
    staleTime: 5 * 60_000,
  });
}

export function useDealPartTypes() {
  return useQuery({
    queryKey: dealKeys.taxonomy("part-types"),
    queryFn: () => dealsService.getPartTypes(),
    staleTime: 5 * 60_000,
  });
}

/**
 * Type-ahead over one catalogue for an exact-item target. Disabled below two
 * characters so an empty picker never pulls the whole catalogue; the picker
 * debounces the term before it gets here.
 */
export function useDealItemSearch(entity: "product" | "part", term: string) {
  const query = term.trim();
  return useQuery({
    queryKey: dealKeys.itemSearch(entity, query),
    queryFn: () =>
      entity === "product"
        ? dealsService.searchProducts(query)
        : dealsService.searchParts(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

/**
 * Create a deal. Writes no rules and moves no prices, so only the deal lists
 * need refreshing — the Markup screens are untouched until it starts.
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDealInput) => dealsService.createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}

/**
 * Start a deal.
 *
 * Two things happen on success beyond the refetch. The `results` array is
 * parked under `dealKeys.startResult(id)`, because it exists in this one
 * response and the detail page is where it gets read. And both Markup lists are
 * invalidated: starting a deal writes markup-rule rows and moves prices, so the
 * screens next door are now stale.
 *
 * A 200 does not mean every target took — read `targetsFailed`.
 */
export function useStartDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealsService.startDeal(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(dealKeys.startResult(id), data);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: MARKUP_RULES_PREFIX });
      queryClient.invalidateQueries({ queryKey: PART_MARKUP_RULES_PREFIX });
      queryClient.invalidateQueries({ queryKey: dealKeys.clashRules("product") });
      queryClient.invalidateQueries({ queryKey: dealKeys.clashRules("part") });
    },
  });
}

/**
 * End a deal: every rule it started resets to base and the deal is terminal.
 * Same invalidation set as start, for the same reason — prices moved.
 */
export function useEndDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealsService.endDeal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: MARKUP_RULES_PREFIX });
      queryClient.invalidateQueries({ queryKey: PART_MARKUP_RULES_PREFIX });
      queryClient.invalidateQueries({ queryKey: dealKeys.clashRules("product") });
      queryClient.invalidateQueries({ queryKey: dealKeys.clashRules("part") });
    },
  });
}
