import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getErrorMessage } from "@/lib/api/error-message";

import { huntsService } from "./hunts.service";
import type {
  CreateHuntCampaignInput,
  HuntCampaign,
  HuntDeal,
  HuntProductPricing,
} from "../types/hunts";
import type { HuntEditPlan } from "../utils/hunt-payload";
import { isMonitorLive } from "../utils/hunt-rows";

/** How often the detail page refetches while a hunt is running. */
export const HUNT_POLL_MS = 15_000;

// ── Query keys ─────────────────────────────────────────────────────────

export const huntKeys = {
  all: ["hunts"] as const,
  list: () => [...huntKeys.all, "list"] as const,
  detail: (id: string) => [...huntKeys.all, "detail", id] as const,
  productPricing: (productId: string) =>
    [...huntKeys.all, "product-pricing", productId] as const,
  dealPercentage: (dealId: string) =>
    [...huntKeys.all, "deal-percentage", dealId] as const,
  productSearch: (term: string) => [...huntKeys.all, "product-search", term] as const,
  clashRules: () => [...huntKeys.all, "clash-rules"] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

/** Every campaign. The route is not paged, so this is the whole list. */
export function useHuntCampaigns() {
  return useQuery({
    queryKey: huntKeys.list(),
    queryFn: () => huntsService.getCampaigns(),
  });
}

/**
 * One campaign, polled every 15 seconds while it is running and not otherwise
 * (`isMonitorLive` says when). The interval is re-decided after each fetch, so
 * polling stops by itself once the campaign ends and its holds settle.
 */
export function useHuntCampaign(id?: string) {
  return useQuery({
    queryKey: huntKeys.detail(id ?? ""),
    queryFn: () => huntsService.getCampaign(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const campaign = query.state.data;
      return campaign && isMonitorLive(campaign, Date.now()) ? HUNT_POLL_MS : false;
    },
  });
}

/**
 * Base prices for a campaign's products, one request per product, keyed by
 * product id.
 *
 * Kept for a minute rather than polled: the percentage is fixed, but the base
 * price can be edited under a scheduled drop, and the page should catch that
 * on the next visit without hammering the products route every 15 seconds.
 */
export function useHuntProductPricing(productIds: string[]) {
  const ids = [...new Set(productIds)];
  return useQueries({
    queries: ids.map((productId) => ({
      queryKey: huntKeys.productPricing(productId),
      queryFn: () => huntsService.getProductPricing(productId),
      staleTime: 60_000,
      retry: 1,
    })),
    combine: (results) => {
      const pricing = new Map<string, HuntProductPricing>();
      for (const result of results) {
        if (result.data) pricing.set(result.data.productId, result.data);
      }
      return { pricing, isLoading: results.some((r) => r.isLoading) };
    },
  });
}

/**
 * The stored discount for every drop the campaign response reports as 0,
 * keyed by deal id. Drops that report a real discount cost no request.
 *
 * Kept for five minutes: a scheduled drop's discount only changes through the
 * hunt-deal edit route, and `useSaveHuntEdits` invalidates this key after it.
 */
export function useHuntDealPercentages(deals: HuntDeal[]) {
  const dealIds = [
    ...new Set(deals.filter((d) => !(d.markupPercentage < 0)).map((d) => d.dealId)),
  ];
  return useQueries({
    queries: dealIds.map((dealId) => ({
      queryKey: huntKeys.dealPercentage(dealId),
      queryFn: () => huntsService.getDealPercentage(dealId),
      staleTime: 5 * 60_000,
      retry: 1,
    })),
    combine: (results) => {
      const byDeal = new Map<string, number>();
      for (const result of results) {
        if (result.data?.percentage != null) {
          byDeal.set(result.data.dealId, result.data.percentage);
        }
      }
      return { byDeal, isLoading: results.some((r) => r.isLoading) };
    },
  });
}

/**
 * Type-ahead over active products for a drop. Off below two characters, so an
 * empty picker never pulls the catalogue. The picker debounces the term.
 */
export function useHuntProductSearch(term: string) {
  const query = term.trim();
  return useQuery({
    queryKey: huntKeys.productSearch(query),
    queryFn: () => huntsService.searchProducts(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

/** Product markup rules for the clash check. One read for the whole form. */
export function useHuntClashRules() {
  return useQuery({
    queryKey: huntKeys.clashRules(),
    queryFn: () => huntsService.getProductMarkupRules(),
    staleTime: 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

/**
 * Create a campaign. The response is the full campaign, so the detail page
 * opens from cache instead of refetching.
 */
export function useCreateHuntCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHuntCampaignInput) => huntsService.createCampaign(data),
    onSuccess: (campaign) => {
      queryClient.setQueryData(huntKeys.detail(campaign.id), campaign);
      queryClient.invalidateQueries({ queryKey: huntKeys.list() });
    },
  });
}

export interface HuntEditResult {
  /** The campaign after the last request that worked, or null if none ran. */
  campaign: HuntCampaign | null;
  /** Drops that did not save, with the server's reason. */
  failed: { number: number; message: string }[];
}

/**
 * Save an edit: the campaign `PATCH` first, then one `PATCH` per changed drop.
 *
 * The campaign request throws, and then nothing has changed. A drop that
 * fails does not stop the rest, since each drop is its own Deal; its reason
 * comes back in `failed`. The drops go one at a time rather than in parallel,
 * which keeps a twenty-drop save well under the backend's per-IP cap.
 *
 * Every drop sent gets its stored-percentage key invalidated, because the
 * detail page reads a scheduled drop's discount from there (backend ask 33).
 */
export function useSaveHuntEdits(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: HuntEditPlan): Promise<HuntEditResult> => {
      let campaign: HuntCampaign | null = null;
      if (plan.campaign) {
        campaign = await huntsService.updateCampaign(campaignId, plan.campaign);
      }
      const failed: HuntEditResult["failed"] = [];
      for (const drop of plan.drops) {
        try {
          campaign = await huntsService.updateHuntDeal(
            campaignId,
            drop.huntDealId,
            drop.body,
          );
        } catch (err) {
          failed.push({
            number: drop.number,
            message: getErrorMessage(err, "The server refused it."),
          });
        }
      }
      return { campaign, failed };
    },
    onSettled: (_data, _error, plan) => {
      queryClient.invalidateQueries({ queryKey: huntKeys.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: huntKeys.list() });
      for (const drop of plan.drops) {
        queryClient.invalidateQueries({ queryKey: huntKeys.dealPercentage(drop.dealId) });
      }
    },
  });
}
