// Types for the hunts slice.
//
// A hunt campaign is a public window holding a few secret five-minute drops.
// Each drop is a "hunt deal": one product, one unit, backed by an ordinary Deal
// with a single negative-percentage target. Every hunt response is typed in the
// OpenAPI spec since backend `3d223e3`, so these alias the codegen schemas and
// the backend's shape stays the only definition.

import type { components } from "@/types/api";

type Schemas = components["schemas"];

/** One campaign, as every staff read and write returns it. */
export type HuntCampaign = Schemas["HuntCampaignAdminResponse"];

/**
 * One drop inside a campaign: its slot, its claim state, and the holder's order.
 *
 * `releasedByStaffId` is stored on the row but not returned, so a release can
 * be told apart only by its `releaseReason` code (see `utils/hunt-rows.ts`).
 */
export type HuntDeal = Schemas["HuntDealAdminResponse"];

/**
 * Where a campaign is in its life. DRAFT is in the enum but nothing creates
 * one: the create route needs full slot data, so a campaign starts SCHEDULED.
 */
export type HuntCampaignStatus = HuntCampaign["status"];

/**
 * ```
 * OPEN     nobody holds it. Also what a release returns it to.
 * HELD     an order locked it and payment is not done. The backend releases
 *          it 15 minutes after `heldAt`, or at once if the payment fails.
 * CLAIMED  that order paid.
 * ```
 */
export type HuntClaimStatus = HuntDeal["claimStatus"];

/** `POST /hunt-campaigns`. Every drop needs its full slot, so a campaign starts SCHEDULED. */
export type CreateHuntCampaignInput = Schemas["CreateHuntCampaignRequest"];

/**
 * `PATCH /hunt-campaigns/{id}`. The backend does not re-check the drops
 * against a moved window, so the form does.
 */
export type UpdateHuntCampaignInput = Schemas["UpdateHuntCampaignRequest"];

/**
 * `PATCH .../hunt-deals/{huntDealId}`. Send `productId` and `markupPercentage`
 * together: the backend rewrites the Deal's whole target from whichever of the
 * two arrive, and a missing percentage is stored as missing.
 */
export type UpdateHuntDealInput = Schemas["UpdateHuntDealRequest"];

/**
 * The slice of a product markup rule the form's clash check reads.
 *
 * A drop is a rule on one product, and a product holds one rule at a time.
 * Switched-off rules still count, as they do in the backend's lookup.
 */
export interface HuntClashRule {
  id: string;
  markupPercentage: number;
  ruleType?: "MARKUP" | "DISCOUNT";
  isActive: boolean;
  notes: string | null;
  productId?: string | null;
}

/** What the hunt price is computed from, for one product. */
export interface HuntProductPricing {
  productId: string;
  /** Lowest `basePrice` across the product's variants, or null if none has one. */
  cheapestBasePrice: number | null;
  /** More than one means the price only holds for the cheapest variant. */
  variantCount: number;
}
