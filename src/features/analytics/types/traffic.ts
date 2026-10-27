import type { AnalyticsPeriod } from "./chart-analytics";

/**
 * The storefront traffic report behind `/analytics`, read from PostHog.
 * Built server-side (`api/traffic.server.ts`) and passed to the view as props.
 */

/** A count now and in the window of the same length just before it. */
export interface Compared {
  value: number;
  previous: number;
}

export interface RankedRow {
  label: string;
  value: number;
  /** Secondary text under the label, e.g. a path or a state. */
  detail?: string;
  /** Where the row opens, e.g. the page on the storefront. */
  href?: string;
}

export interface TrafficSession {
  sessionId: string;
  distinctId: string;
  /** Null for anonymous visitors, and for viewers without `customers:read`. */
  name: string | null;
  identified: boolean;
  startedAt: string;
  durationSeconds: number;
  pageviews: number;
  entryPath: string;
  channel: string;
  location: string;
  device: string;
  orders: number;
  hasReplay: boolean;
}

/** What one campaign, or one ad in it, brought in. */
export interface CampaignRow {
  /** `utm_campaign` on the campaign's row, `utm_content` on an ad's ("" when the link had none). */
  label: string;
  /** `utm_source`, e.g. fb, ig. */
  source: string;
  visitors: number;
  sessions: number;
  /** Share of sessions that left after one page, 0 to 1. */
  bounceRate: number;
  productViews: number;
  adds: number;
  checkouts: number;
  orders: number;
  /** People who ordered; conversion is buyers over visitors. */
  buyers: number;
  orderValue: number;
}

export interface CampaignGroup extends CampaignRow {
  ads: CampaignRow[];
}

export interface TrafficReport {
  period: AnalyticsPeriod;
  generatedAt: string;
  kpis: {
    visitors: Compared;
    sessions: Compared;
    pageviews: Compared;
    orders: Compared;
    orderValue: number;
    bounceRate: number;
    avgSessionSeconds: number;
    pagesPerSession: number;
  };
  /** One point per day (7d, 30d), week (90d) or month (12m). */
  trend: { date: string; visitors: number; pageviews: number }[];
  trendBucket: "day" | "week" | "month";
  funnel: { step: string; people: number }[];
  countries: RankedRow[];
  cities: RankedRow[];
  channels: RankedRow[];
  referrers: RankedRow[];
  /**
   * Last click credits the campaign that started each session. First touch
   * credits the campaign behind each person's first visit in the past year,
   * so their later direct visits count for it too.
   */
  campaigns: { lastClick: CampaignGroup[]; firstTouch: CampaignGroup[] };
  /** Entry pages of paid sessions; `source` is the paid channel, `href` the live page. */
  landingPages: (CampaignRow & { href: string })[];
  devices: RankedRow[];
  products: (RankedRow & { viewers: number; itemType: string })[];
  pages: (RankedRow & { visitors: number })[];
  live: { visitors: number; pages: RankedRow[] };
  sessions: TrafficSession[];
}
