import { TimeRail } from "@/components/shared/time-rail";

import type { Deal } from "../types/deals";
import { DAY_MS, dealWindow, timeOverlaps } from "../utils/deal-groups";
import { formatDealDistance, formatDealTime } from "../utils/deal-timing";

const iso = (t: number) => new Date(t).toISOString();

/**
 * The selected deal's own rail, then one pale rail per deal that runs at the
 * same time. Time only: two deals on this list may cover different items.
 */
export function DealRail({ deal, others, now }: { deal: Deal; others: Deal[]; now: number }) {
  const window = dealWindow(deal);
  if (!window) return null;

  const range = {
    start: window.start,
    end: window.end ?? Math.max(now, window.start) + 14 * DAY_MS,
  };
  const overlaps = timeOverlaps(deal, others);
  const ends = window.end === null ? null : iso(window.end);

  return (
    <section aria-label="When this deal runs" className="space-y-2">
      <div className="flex flex-wrap justify-between gap-x-4 text-xs text-muted-foreground tabular-nums">
        <span>{formatDealTime(iso(window.start))}</span>
        <span>
          {ends ? `Ends ${formatDealTime(ends)} · ${formatDealDistance(ends, now)}` : "No end time"}
        </span>
      </div>
      <TimeRail
        range={range}
        start={window.start}
        end={window.end}
        now={now}
        upcoming={deal.status === "SCHEDULED"}
        label={`${deal.name}: from ${formatDealTime(iso(window.start))}${ends ? ` to ${formatDealTime(ends)}` : ", no end time"}.`}
      />
      {overlaps.map((o) => (
        <div key={o.deal.id}>
          <TimeRail
            range={range}
            start={o.window.start}
            end={o.window.end}
            now={now}
            upcoming
            className="opacity-70"
            label={`${o.deal.name} runs at the same time from ${formatDealTime(iso(o.from))}.`}
          />
          <p className="text-xs text-muted-foreground">
            {o.deal.name} runs at the same time from {formatDealTime(iso(o.from))}.
          </p>
        </div>
      ))}
    </section>
  );
}
