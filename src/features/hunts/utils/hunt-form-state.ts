// What the campaign form holds while staff type, and how it becomes the
// schema's input.
//
// Times stay as the raw `datetime-local` strings, read as WAT, until the
// schema needs them. Prices stay as the digits staff typed. Pure, so edit-mode
// prefill and the lock rules can be tested without rendering.

import type { ScopeItem } from "@/components/shared/item-scope-picker";

import type { HuntFormInput } from "../schemas/hunt-form";
import type { HuntCampaign, HuntDeal, HuntProductPricing } from "../types/hunts";
import { huntPrice, resolvePercentage } from "./hunt-price";
import { slotsInOrder } from "./hunt-rows";
import {
  HUNT_DEFAULT_DROPS,
  defaultRevealAt,
  defaultSlotEnd,
} from "./hunt-schedule";
import { fromHuntTimeInput, toHuntTimeInput } from "./hunt-time";

/** One drop row as the form holds it. */
export interface HuntDropDraft {
  /** Row identity. The hunt deal's id in edit mode, a random key on create. */
  key: string;
  /** Why the row is read-only, or null when it can be edited. */
  lockedReason: string | null;
  product: ScopeItem | null;
  /** Naira, digits only. */
  priceInput: string;
  /**
   * The saved percentage, kept until staff retype the price or change the
   * product. Sending it back unchanged means an untouched drop is never
   * re-rounded through a naira figure.
   */
  storedPercentage: number | null;
  slotStartInput: string;
  slotEndInput: string;
  revealAtInput: string;
  /** True while the slot end tracks the start: five minutes after it. */
  endFollows: boolean;
  /** True while the reveal tracks the start: ten minutes before it. */
  revealFollows: boolean;
}

export interface HuntFormState {
  name: string;
  windowStartInput: string;
  windowEndInput: string;
  drops: HuntDropDraft[];
}

export function emptyDropDraft(): HuntDropDraft {
  return {
    key: `d-${Math.random().toString(36).slice(2, 10)}`,
    lockedReason: null,
    product: null,
    priceInput: "",
    storedPercentage: null,
    slotStartInput: "",
    slotEndInput: "",
    revealAtInput: "",
    endFollows: true,
    revealFollows: true,
  };
}

/** A blank campaign in the design's shape: four drops. */
export function createInitialState(): HuntFormState {
  return {
    name: "",
    windowStartInput: "",
    windowEndInput: "",
    drops: Array.from({ length: HUNT_DEFAULT_DROPS }, () => emptyDropDraft()),
  };
}

/** Set a drop's start. The end and the reveal follow it unless staff edited them. */
export function applySlotStart(draft: HuntDropDraft, input: string): HuntDropDraft {
  const start = fromHuntTimeInput(input);
  return {
    ...draft,
    slotStartInput: input,
    slotEndInput:
      draft.endFollows && start ? toHuntTimeInput(defaultSlotEnd(start)) : draft.slotEndInput,
    revealAtInput:
      draft.revealFollows && start
        ? toHuntTimeInput(defaultRevealAt(start))
        : draft.revealAtInput,
  };
}

/**
 * Why a saved drop cannot be edited, or null.
 *
 * HELD and CLAIMED are the backend's own lock (`HUNT_DEAL_NOT_EDITABLE`). An
 * opened slot is ours: the backend would let an unclaimed live drop be
 * rescheduled, and moving a drop customers may be looking at is never right.
 */
export function lockReason(deal: HuntDeal, now: number): string | null {
  if (deal.claimStatus === "HELD") {
    return "Held by an order awaiting payment, so it can't be edited.";
  }
  if (deal.claimStatus === "CLAIMED") return "Won and paid, so it can't be edited.";
  if (new Date(deal.slotStart).getTime() <= now) {
    return "This drop has already opened, so it can't be moved.";
  }
  return null;
}

const sameInstant = (a: string, b: string) =>
  new Date(a).getTime() === new Date(b).getTime();

/**
 * A saved campaign, as the form opens it.
 *
 * The percentage comes through `resolvePercentage`, because the campaign
 * response reports 0 for every drop that has not started (backend ask 33).
 * Prefilling from that 0 would put the base price in the box and save 0,
 * which the backend refuses.
 */
export function editInitialState(
  campaign: HuntCampaign,
  pricing: Map<string, HuntProductPricing>,
  storedPercentages: Map<string, number>,
  now: number,
): HuntFormState {
  return {
    name: campaign.name,
    windowStartInput: toHuntTimeInput(campaign.windowStart),
    windowEndInput: toHuntTimeInput(campaign.windowEnd),
    drops: slotsInOrder(campaign.huntDeals).map((deal) => {
      const percentage = resolvePercentage(
        deal.markupPercentage,
        storedPercentages.get(deal.dealId),
      );
      const base = deal.productId
        ? (pricing.get(deal.productId)?.cheapestBasePrice ?? null)
        : null;
      return {
        key: deal.id,
        lockedReason: lockReason(deal, now),
        product: deal.productId
          ? { id: deal.productId, name: deal.productName ?? "Unnamed product" }
          : null,
        priceInput:
          percentage !== null && base !== null ? String(huntPrice(base, percentage)) : "",
        storedPercentage: percentage,
        slotStartInput: toHuntTimeInput(deal.slotStart),
        slotEndInput: toHuntTimeInput(deal.slotEnd),
        revealAtInput: toHuntTimeInput(deal.revealAt),
        endFollows: sameInstant(deal.slotEnd, defaultSlotEnd(deal.slotStart)),
        revealFollows: sameInstant(deal.revealAt, defaultRevealAt(deal.slotStart)),
      };
    }),
  };
}

/** The form, as `huntFormSchema` reads it: ISO times and each product's base price. */
export function toFormValues(
  state: HuntFormState,
  pricing: Map<string, HuntProductPricing>,
): HuntFormInput {
  return {
    name: state.name.trim(),
    windowStart: fromHuntTimeInput(state.windowStartInput),
    windowEnd: fromHuntTimeInput(state.windowEndInput),
    drops: state.drops.map((draft) => ({
      key: draft.key,
      locked: draft.lockedReason !== null,
      productId: draft.product?.id ?? null,
      productName: draft.product?.name ?? null,
      basePrice: draft.product
        ? (pricing.get(draft.product.id)?.cheapestBasePrice ?? null)
        : null,
      price: draft.priceInput ? Number(draft.priceInput) : null,
      storedPercentage: draft.storedPercentage,
      slotStart: fromHuntTimeInput(draft.slotStartInput),
      slotEnd: fromHuntTimeInput(draft.slotEndInput),
      revealAt: fromHuntTimeInput(draft.revealAtInput),
    })),
  };
}
