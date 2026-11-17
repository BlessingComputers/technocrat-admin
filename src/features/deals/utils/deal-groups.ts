// How the deals list groups, orders and times its rows.
//
// Pure, so the list, the overview and the detail rail agree, and the sweep's
// five-minute lateness is pinned by tests instead of rediscovered.

import type { RailRange } from "@/lib/utils/time-rail";

import type { Deal } from "../types/deals";
import { dealExpiry, dealStart, formatDealDistance, formatDealTime } from "./deal-timing";

export const DAY_MS = 86_400_000;

export interface DealGroups {
  running: Deal[];
  comingUp: Deal[];
  drafts: Deal[];
}

const ms = (value: string | null): number | null => {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
};

/** Running by soonest end (open-ended last), coming up by soonest start, drafts newest first. ENDED is dropped: it pages on its own. */
export function groupDeals(deals: Deal[]): DealGroups {
  const by = (status: Deal["status"]) => deals.filter((d) => d.status === status);
  const endOf = (d: Deal) => ms(d.expiresAt) ?? Number.POSITIVE_INFINITY;
  return {
    running: by("ACTIVE").sort((a, b) => endOf(a) - endOf(b)),
    comingUp: by("SCHEDULED").sort(
      (a, b) => (ms(a.startsAt) ?? 0) - (ms(b.startsAt) ?? 0),
    ),
    drafts: by("DRAFT").sort((a, b) => (ms(b.createdAt) ?? 0) - (ms(a.createdAt) ?? 0)),
  };
}

export interface DealWindow {
  start: number;
  /** null = runs until someone ends it. */
  end: number | null;
}

/**
 * When a running or scheduled deal runs. A deal started by hand has no
 * `startsAt`; the start flips the status, so `updatedAt` is the start time
 * (the admin never edits a deal). Drafts have no dates; ended deals need none.
 */
export function dealWindow(deal: Deal): DealWindow | null {
  if (deal.status !== "ACTIVE" && deal.status !== "SCHEDULED") return null;
  const start = ms(deal.startsAt) ?? (deal.status === "ACTIVE" ? ms(deal.updatedAt) : null);
  if (start === null) return null;
  return { start, end: ms(deal.expiresAt) };
}

export interface DealOverlap {
  deal: Deal;
  window: DealWindow;
  /** When the two start running together. */
  from: number;
}

/** Other running or scheduled deals that run at the same time as `deal`. Time only, not items (spec decision 6). */
export function timeOverlaps(deal: Deal, others: Deal[]): DealOverlap[] {
  const mine = dealWindow(deal);
  if (!mine) return [];
  const myEnd = mine.end ?? Number.POSITIVE_INFINITY;
  return others
    .flatMap((other) => {
      if (other.id === deal.id) return [];
      const window = dealWindow(other);
      if (!window) return [];
      const from = Math.max(mine.start, window.start);
      const to = Math.min(myEnd, window.end ?? Number.POSITIVE_INFINITY);
      return from < to ? [{ deal: other, window, from }] : [];
    })
    .sort((a, b) => a.from - b.from);
}

/** Each overlapping pair once, for the overview's notes. */
export function overlapPairs(deals: Deal[]): { a: Deal; b: Deal; from: number }[] {
  return deals.flatMap((a, i) =>
    timeOverlaps(a, deals.slice(i + 1)).map((o) => ({ a, b: o.deal, from: o.from })),
  );
}

/**
 * "The next two weeks": four days back for context, sixteen ahead. The end
 * stretches to two days past the latest start in `deals`, so a deal scheduled
 * beyond day sixteen still shows a segment (spec, Deals: "clamped so every
 * shown deal has a visible segment").
 */
export function overviewRange(now: number, deals: Deal[] = []): RailRange {
  const latestStart = Math.max(
    Number.NEGATIVE_INFINITY,
    ...deals.map((d) => dealWindow(d)?.start ?? Number.NEGATIVE_INFINITY),
  );
  return { start: now - 4 * DAY_MS, end: Math.max(now + 16 * DAY_MS, latestStart + 2 * DAY_MS) };
}

/** The overview's heading. Counts the weeks ahead once the range stretches past day sixteen. */
export function overviewHeading(range: RailRange, now: number): string {
  if (range.end <= now + 16 * DAY_MS) return "The next two weeks";
  return `The next ${Math.ceil((range.end - now) / (7 * DAY_MS))} weeks`;
}

/** The row's timing line. The wording of the old table's timing cell, one line. */
export function timingLine(deal: Deal, now: number): string {
  const expiry = dealExpiry(deal.expiresAt, now);
  const start = dealStart(deal.startsAt, now);

  switch (deal.status) {
    case "ENDED":
      return expiry.state === "past"
        ? `Ended ${formatDealDistance(expiry.at, now)}`
        : "Ended manually";
    case "SCHEDULED":
      return start.state === "future" ? `Starts ${formatDealTime(start.at)}` : "Starting shortly";
    case "DRAFT":
      return "Not started";
    case "ACTIVE":
      if (expiry.state === "past") {
        return `Ended ${formatDealDistance(expiry.at, now)} · prices reset on the next sweep`;
      }
      return expiry.state === "future"
        ? `Ends ${formatDealDistance(expiry.at, now)}`
        : "Runs until you end it";
  }
}
