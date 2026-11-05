import type { AnalyticsPeriod } from "../types/chart-analytics";
import type { AdSpend, DateWindow } from "../types/ad-spend";

/**
 * Ad spend against the campaign table (backend ask 37). Entries are date
 * ranges, not days, because Ads Manager reports spend for whatever range you
 * pick. When the report's period cuts through an entry, the entry is spread
 * evenly over its days and only the days inside the period count.
 */

const DAY_MS = 86_400_000;

/** Matches the PostHog report windows in `api/traffic.server.ts`. */
export const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

export function parsePeriod(value?: string): AnalyticsPeriod {
  return value && value in PERIOD_DAYS ? (value as AnalyticsPeriod) : "30d";
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY_MS;

/** The last `days` UTC days, today included. */
export function spendWindow(days: number, today = new Date()): DateWindow {
  return { from: ymd(new Date(today.getTime() - (days - 1) * DAY_MS)), to: ymd(today) };
}

/** Campaigns are stored lowercased; PostHog labels keep the case they were typed in. */
export const spendKey = (label: string) => label.trim().toLowerCase();

export function amountInWindow(
  entry: Pick<AdSpend, "startDate" | "endDate" | "amount">,
  range: DateWindow,
): number {
  const start = dayNumber(entry.startDate);
  const end = dayNumber(entry.endDate);
  const overlap = Math.min(end, dayNumber(range.to)) - Math.max(start, dayNumber(range.from)) + 1;
  return overlap > 0 ? (entry.amount * overlap) / (end - start + 1) : 0;
}

export interface CampaignSpend {
  /** Every entry for the campaign, with or without an ad. */
  total: number;
  /** Entries that name an ad (`utm_content`), keyed by `spendKey`. */
  byAd: Map<string, number>;
}

export function spendByCampaign(entries: AdSpend[], range: DateWindow): Map<string, CampaignSpend> {
  const spend = new Map<string, CampaignSpend>();
  for (const entry of entries) {
    const amount = amountInWindow(entry, range);
    if (amount <= 0) continue;
    const key = spendKey(entry.campaign);
    const row = spend.get(key) ?? { total: 0, byAd: new Map<string, number>() };
    row.total += amount;
    if (entry.adContent) {
      const ad = spendKey(entry.adContent);
      row.byAd.set(ad, (row.byAd.get(ad) ?? 0) + amount);
    }
    spend.set(key, row);
  }
  return spend;
}

/** Spend logged against campaigns that brought no tagged visits in the period. */
export function unmatchedSpend(
  spend: Map<string, CampaignSpend>,
  labels: string[],
): { campaign: string; total: number }[] {
  const seen = new Set(labels.map(spendKey));
  return [...spend]
    .filter(([campaign]) => !seen.has(campaign))
    .map(([campaign, { total }]) => ({ campaign, total }));
}

/** Order value as a multiple of spend: "3.2×". A dash when nothing was spent. */
export function formatRoas(orderValue: number, spend: number | undefined): string {
  return spend ? `${(orderValue / spend).toFixed(1)}×` : "–";
}
