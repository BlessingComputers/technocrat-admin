import type { components } from "@/types/api";

/** One ad spend entry (`/v1/analytics/ad-spend`, backend ask 37). */
export type AdSpend = components["schemas"]["AdSpend"];

export type AdPlatform = AdSpend["platform"];

/** POST body; PATCH takes any subset. `campaign` is stored trimmed and lowercased. */
export interface AdSpendBody {
  platform: AdPlatform;
  campaign: string;
  adContent: string | null;
  startDate: string;
  endDate: string;
  amount: number;
  note: string | null;
}

/** UTC `YYYY-MM-DD`, both ends inclusive. */
export interface DateWindow {
  from: string;
  to: string;
}
