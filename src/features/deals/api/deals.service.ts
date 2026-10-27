import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { paths } from "@/types/api";
import type {
  ClashRule,
  CreateDealInput,
  Deal,
  DealDetail,
  DealEndResponse,
  DealStartResponse,
} from "../types/deals";

/**
 * Deals data access.
 *
 * Every route below needs `priceMarkup:read` or `priceMarkup:write` — part
 * targets included, because the backend calls `setPartFlashSalePricing` itself
 * rather than making us hit the parts endpoint with `products:write`.
 *
 * Path params take the deal's DB UUID (`id`), never the human `DEAL-XXXXXXXX`.
 * The client unwraps the response envelope (ADR-0007), so each call returns the
 * inner payload directly.
 */

const { deals, pricing, parts, categories, brands } = API_ENDPOINTS.products;

export const dealsService = {
  /**
   * One page of deals, newest first, optionally one status of them.
   *
   * Paged on the server since `3d223e3`: `limit` defaults to 20 and caps at
   * 100. `meta` is a top-level sibling of `data`, so the shared client's unwrap
   * would drop it and leave the first 20 deals looking like all of them. Read
   * raw and hand back both halves.
   *
   * `?status=` is server-side and exists on every backend. It has to be: a
   * status filtered client-side over one page would show "no active deals" on
   * page 1 while page 3 holds one.
   */
  getDeals: async ({
    status,
    page,
    limit,
  }: DealsListParams = {}): Promise<DealsPage> => {
    const res = await api.get<DealsPage>(deals.list, {
      params: { status, page, limit },
      raw: true,
    });
    return { data: res.data, meta: res.meta };
  },

  /** The deal plus the rules it has materialised (none before it starts). */
  getDeal: (id: string) => api.get<DealDetail>(deals.detail(id)),

  /**
   * Create a deal. Writes no rules and moves no prices — `start` does that.
   *
   * This screen never sends `startsAt`, so everything it creates is a DRAFT.
   * A SCHEDULED deal cannot be edited, cancelled or deleted before it fires
   * (backend ask 28), and there is no `PATCH`/`DELETE` to undo a mistake with.
   */
  createDeal: (data: CreateDealInput) => api.post<Deal>(deals.list, data),

  /**
   * Turn every stored target into a live rule. Prices move on this call.
   *
   * Partial success is normal, not exceptional: a target can fail on its own
   * (usually `MARKUP_RULE_SCOPE_CONFLICT`) while the rest go live, and the deal
   * still comes back ACTIVE. Read `results` / `targetsFailed`, never just the
   * 200.
   *
   * 409 means someone — or the sweep — already started or ended it.
   */
  startDeal: (id: string) => api.post<DealStartResponse>(deals.start(id)),

  /**
   * Reset every rule this deal started back to base price and mark it ENDED.
   * Terminal: to run the same sale again, create another deal.
   *
   * Safe to call after the expiry sweep has already reset the rules — resetting
   * an inactive rule is a no-op write, not an error. 409 `DEAL_NOT_ACTIVE`
   * means it was not ACTIVE to begin with.
   */
  endDeal: (id: string) => api.post<DealEndResponse>(deals.end(id)),

  // ── Reads that only feed the clash check and the pickers ──────────────
  //
  // The deals slice cannot import the products or parts slices (features are
  // siblings), so it reads the same shared endpoints through its own thin
  // service — the pattern `partTaxonomyService` already set. Read-only:
  // managing rules, categories and brands stays where it lives.

  /**
   * Every product markup rule, unfiltered.
   *
   * Deliberately unfiltered: the clash check has to see markups AND discounts,
   * and `?type=` does not exist on prod anyway (it landed in `2f01924`, which
   * `main` predates), so a filtered call would come back whole against
   * DigitalOcean and quietly mean something different per environment.
   */
  getProductMarkupRules: () => api.get<ClashRule[]>(pricing.markupRules),

  /** The parts twin, same reasoning. */
  getPartMarkupRules: () => api.get<ClashRule[]>(parts.markup.rules),

  getCategories: () => api.get<DealTaxonomyOption[]>(categories),

  getBrands: () => api.get<DealTaxonomyOption[]>(brands),

  getPartTypes: () => api.get<DealTaxonomyOption[]>(parts.types),

  /**
   * Type-ahead over the product catalogue for an exact-product target.
   *
   * The products list keeps `meta` as a top-level sibling of `data`, so the
   * shared client's unwrap would drop it — read raw and pull `data` ourselves.
   * The `id` here is the DB UUID, which is what a target's `productId` resolves
   * against, not the human `productId`/SKU.
   */
  searchProducts: async (query: string): Promise<DealItemOption[]> => {
    const res = await api.get<ItemSearchEnvelope>(API_ENDPOINTS.products.list, {
      params: { q: query || undefined, limit: 20, page: 1, isActive: "true" },
      raw: true,
    });
    return (res?.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  },

  /**
   * Type-ahead over the parts catalogue. The parts list nests `{ data, meta }`
   * INSIDE the envelope's data key, so the unwrap already lands on the inner
   * object and no `raw` is needed — the one asymmetry with products above.
   */
  searchParts: async (query: string): Promise<DealItemOption[]> => {
    const res = await api.get<ItemSearchEnvelope>(parts.list, {
      params: { q: query || undefined, limit: 20, page: 1, isActive: "true" },
    });
    return (res?.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  },
};

type DealsListOperation = paths["/api/v1/products/deals"]["get"];

/** Query for one page of the deals list. Omit `status` for every status. */
export type DealsListParams = NonNullable<
  DealsListOperation["parameters"]["query"]
>;

/** `total`, `page`, `limit`, `totalPages` and the has-next/prev flags. */
export type DealsListMeta =
  DealsListOperation["responses"][200]["content"]["application/json"]["meta"];

/**
 * One page of deals and where it sits in the whole list. The rows stay on the
 * slice's own `Deal`, which the table and detail page already read.
 */
export interface DealsPage {
  data: Deal[];
  meta: DealsListMeta;
}

/** A category, brand or part type, as the target builder's selects render it. */
export interface DealTaxonomyOption {
  id: string;
  name: string;
}

/** One catalogue hit in the exact-item picker. */
export interface DealItemOption {
  id: string;
  name: string;
}

/** The slice of a catalogue list envelope the pickers need. */
interface ItemSearchEnvelope {
  data: Array<{ id: string; name: string }>;
}
