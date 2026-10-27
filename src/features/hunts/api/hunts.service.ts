import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  CreateHuntCampaignInput,
  HuntCampaign,
  HuntCampaignStatus,
  HuntClashRule,
  HuntProductPricing,
  UpdateHuntCampaignInput,
  UpdateHuntDealInput,
} from "../types/hunts";
import { cheapestBasePrice } from "../utils/hunt-price";

/**
 * Treasure-hunt data access.
 *
 * The campaign routes need `huntCampaigns:read`; that group is separate from
 * `priceMarkup` even though every drop runs on a Deal. Path params take the
 * campaign's DB UUID (`id`), never the human `HUNT-XXXXXXXX`. The client
 * unwraps the `{ success, data }` envelope (ADR-0007).
 */

const { hunts } = API_ENDPOINTS;

export const huntsService = {
  /**
   * Every campaign, newest first. Not paged, so the list screen filters by
   * status in the browser and never sends `?status=`.
   */
  getCampaigns: (status?: HuntCampaignStatus) =>
    api.get<HuntCampaign[]>(hunts.list, { params: { status } }),

  /** One campaign with every drop's claim state and the holder's order. */
  getCampaign: (id: string) => api.get<HuntCampaign>(hunts.detail(id)),

  /**
   * The numbers a drop's naira price is computed from.
   *
   * The admin response carries only the stored percentage, so the base price
   * comes from the product itself. This slice cannot import the products
   * slice, so it reads the same endpoint through its own thin call, the way
   * the deals slice reads markup rules. Read-only.
   */
  getProductPricing: async (productId: string): Promise<HuntProductPricing> => {
    const product = await api.get<PricedProduct>(
      `${API_ENDPOINTS.products.base}/${productId}`,
    );
    const variants = product?.variants ?? [];
    return {
      productId,
      cheapestBasePrice: cheapestBasePrice(variants),
      variantCount: variants.length,
    };
  },

  /**
   * The discount stored on the Deal behind a drop, from its single target.
   *
   * Needed because the campaign response reports 0 for any drop that has not
   * started (see `resolvePercentage`). The Deal's `targets` hold the real
   * number from creation. Needs `priceMarkup:read`, which the seed grants
   * alongside `huntCampaigns:read`.
   */
  getDealPercentage: async (dealId: string): Promise<StoredPercentage> => {
    const deal = await api.get<DealTargets>(
      API_ENDPOINTS.products.deals.detail(dealId),
    );
    const percentage = deal?.targets?.[0]?.markupPercentage;
    return {
      dealId,
      percentage: typeof percentage === "number" ? percentage : null,
    };
  },

  // ── Writes, `huntCampaigns:write` ──────────────────────────────────────

  /**
   * Create a campaign and one Deal per drop, each scheduled to start and end
   * on its own slot. Always SCHEDULED: there is no save-as-draft.
   */
  createCampaign: (data: CreateHuntCampaignInput) =>
    api.post<HuntCampaign>(hunts.list, data),

  /**
   * Name and window only. 409 `HUNT_CAMPAIGN_NOT_EDITABLE` once ACTIVE or
   * ENDED. The backend does not check the drops against a moved window.
   */
  updateCampaign: (id: string, data: UpdateHuntCampaignInput) =>
    api.patch<HuntCampaign>(hunts.detail(id), data),

  /**
   * One drop's product, discount and times. Returns the whole campaign. 409
   * `HUNT_DEAL_NOT_EDITABLE` once the drop is held or claimed.
   */
  updateHuntDeal: (id: string, huntDealId: string, data: UpdateHuntDealInput) =>
    api.patch<HuntCampaign>(hunts.huntDeal(id, huntDealId), data),

  // ── Reads that only feed the form ──────────────────────────────────────
  //
  // Thin copies of what the deals slice reads, since features may not import
  // each other.

  /**
   * Every product markup rule, unfiltered, for the clash check. A drop is a
   * rule on one product, and any rule already there blocks it from starting.
   */
  getProductMarkupRules: () =>
    api.get<HuntClashRule[]>(API_ENDPOINTS.products.pricing.markupRules),

  /**
   * Type-ahead over active products. The list keeps `meta` beside `data`, so
   * read raw and take `data`. The `id` is the DB UUID a drop's `productId`
   * wants, not the SKU.
   */
  searchProducts: async (query: string): Promise<HuntProductOption[]> => {
    const res = await api.get<{ data: HuntProductOption[] }>(
      API_ENDPOINTS.products.list,
      {
        params: { q: query || undefined, limit: 20, page: 1, isActive: "true" },
        raw: true,
      },
    );
    return (res?.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  },
};

/** One hit in the drop's product picker. */
export interface HuntProductOption {
  id: string;
  name: string;
}

/** The slice of the admin product detail the price needs. */
interface PricedProduct {
  id: string;
  variants?: Array<{ basePrice?: number | null }>;
}

/** The slice of a Deal the stored percentage lives in. */
interface DealTargets {
  targets?: Array<{ markupPercentage?: number }>;
}

/** One drop's stored discount, keyed back to its Deal. */
export interface StoredPercentage {
  dealId: string;
  percentage: number | null;
}
