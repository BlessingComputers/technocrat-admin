// How the hunts list groups its campaigns, and which one opens by default.

import type { HuntCampaign } from "../types/hunts";

export interface CampaignGroups {
  live: HuntCampaign[];
  /** SCHEDULED, plus any stray DRAFT (nothing creates one, but All used to show it). */
  scheduled: HuntCampaign[];
  ended: HuntCampaign[];
}

const t = (iso: string) => Date.parse(iso);

export function groupCampaigns(campaigns: HuntCampaign[]): CampaignGroups {
  const byStart = (a: HuntCampaign, b: HuntCampaign) => t(a.windowStart) - t(b.windowStart);
  return {
    live: campaigns.filter((c) => c.status === "ACTIVE").sort(byStart),
    scheduled: campaigns
      .filter((c) => c.status === "SCHEDULED" || c.status === "DRAFT")
      .sort(byStart),
    ended: campaigns
      .filter((c) => c.status === "ENDED")
      .sort((a, b) => t(b.windowEnd) - t(a.windowEnd)),
  };
}

/**
 * The campaign the page opens when the URL names none: the live one, else the
 * next scheduled one. A scheduled campaign whose window already passed is stale
 * (the list warns about it) and is never the default.
 */
export function defaultCampaign(
  campaigns: HuntCampaign[],
  now: number,
): HuntCampaign | undefined {
  const g = groupCampaigns(campaigns);
  return g.live[0] ?? g.scheduled.find((c) => t(c.windowEnd) >= now);
}
