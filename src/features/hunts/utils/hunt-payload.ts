// Turning a validated form into requests.
//
// Create is one body. Edit is a campaign `PATCH` for the name and window, plus
// one per-drop `PATCH` for each drop that changed. There is no route that
// saves both at once.

import { dropPercentage, type HuntFormValues } from "../schemas/hunt-form";
import type {
  CreateHuntCampaignInput,
  HuntCampaign,
  UpdateHuntCampaignInput,
  UpdateHuntDealInput,
} from "../types/hunts";
import { resolvePercentage } from "./hunt-price";

/** The Deal target's `notes` column takes 500 characters. */
const notesFor = (name: string | null) => (name ? name.slice(0, 500) : undefined);

/** Call only on values `huntFormSchema` accepted: every drop is then complete. */
export function toCreateRequest(values: HuntFormValues): CreateHuntCampaignInput {
  return {
    name: values.name,
    windowStart: values.windowStart,
    windowEnd: values.windowEnd,
    huntDeals: values.drops.map((drop) => ({
      productId: drop.productId as string,
      markupPercentage: dropPercentage(drop) as number,
      slotStart: drop.slotStart,
      slotEnd: drop.slotEnd,
      revealAt: drop.revealAt,
      notes: notesFor(drop.productName),
    })),
  };
}

export interface HuntDropPatch {
  huntDealId: string;
  dealId: string;
  /** Position on screen, for "Drop 3 didn't save". */
  number: number;
  body: UpdateHuntDealInput;
}

export interface HuntEditPlan {
  campaign: UpdateHuntCampaignInput | null;
  drops: HuntDropPatch[];
}

const sameInstant = (a: string | null, b: string | null) =>
  a === b || (a !== null && b !== null && new Date(a).getTime() === new Date(b).getTime());

/**
 * What an edit has to send, and nothing more.
 *
 * A changed drop sends its whole state. `productId` and `markupPercentage` go
 * together because the backend rebuilds the Deal's target from whichever
 * arrive and stores a missing percentage as missing. The times go too, which
 * costs nothing: the backend reschedules the drop's jobs on every edit anyway.
 *
 * `storedPercentages` is the Deal's own target, keyed by deal id. The campaign
 * response reports 0 for a drop that has not started (backend ask 33), so the
 * comparison has to use the stored number or every drop looks changed.
 */
export function planEdits(
  original: HuntCampaign,
  storedPercentages: Map<string, number>,
  values: HuntFormValues,
): HuntEditPlan {
  const campaign: UpdateHuntCampaignInput = {};
  if (values.name !== original.name) campaign.name = values.name;
  if (!sameInstant(values.windowStart, original.windowStart)) {
    campaign.windowStart = values.windowStart;
  }
  if (!sameInstant(values.windowEnd, original.windowEnd)) {
    campaign.windowEnd = values.windowEnd;
  }

  const drops: HuntDropPatch[] = [];
  values.drops.forEach((drop, i) => {
    if (drop.locked) return;
    const before = original.huntDeals.find((d) => d.id === drop.key);
    if (!before) return;

    const percentage = dropPercentage(drop) as number;
    const beforePercentage = resolvePercentage(
      before.markupPercentage,
      storedPercentages.get(before.dealId),
    );
    const changed =
      drop.productId !== before.productId ||
      percentage !== beforePercentage ||
      !sameInstant(drop.slotStart, before.slotStart) ||
      !sameInstant(drop.slotEnd, before.slotEnd) ||
      !sameInstant(drop.revealAt, before.revealAt);
    if (!changed) return;

    drops.push({
      huntDealId: before.id,
      dealId: before.dealId,
      number: i + 1,
      body: {
        productId: drop.productId as string,
        markupPercentage: percentage,
        slotStart: drop.slotStart,
        slotEnd: drop.slotEnd,
        revealAt: drop.revealAt,
        notes: notesFor(drop.productName),
      },
    });
  });

  return {
    campaign: Object.keys(campaign).length > 0 ? campaign : null,
    drops,
  };
}
