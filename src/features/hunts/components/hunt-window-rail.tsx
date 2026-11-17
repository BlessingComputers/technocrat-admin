import { RailAxis, TimeRail, type RailMarker } from "@/components/shared/time-rail";

import type { HuntCampaign, HuntDeal } from "../types/hunts";
import { slotPhase, slotsInOrder } from "../utils/hunt-rows";
import { formatHuntClock, formatHuntTick, formatHuntWindow } from "../utils/hunt-time";

type DropState = "claimed" | "held" | "live" | "open" | "missed";

const STYLE: Record<DropState, string> = {
  claimed: "bg-success",
  held: "bg-warning",
  live: "bg-info ring-4 ring-info/25",
  open: "border-2 border-info bg-card",
  missed: "bg-muted-foreground/40",
};

const LABEL: Record<DropState, string> = {
  claimed: "Claimed",
  held: "Held, awaiting payment",
  live: "Live now",
  open: "Still to drop",
  missed: "Not claimed",
};

function dropState(deal: HuntDeal, now: number): DropState {
  if (deal.claimStatus === "CLAIMED") return "claimed";
  if (deal.claimStatus === "HELD") return "held";
  const phase = slotPhase(deal, now);
  return phase === "live" ? "live" : phase === "over" ? "missed" : "open";
}

/** The public window as a rail, one marker per secret drop (spec, Treasure hunts). */
export function HuntWindowRail({ campaign, now }: { campaign: HuntCampaign; now: number }) {
  const range = { start: Date.parse(campaign.windowStart), end: Date.parse(campaign.windowEnd) };
  const drops = slotsInOrder(campaign.huntDeals).map((deal) => ({
    deal,
    state: dropState(deal, now),
  }));
  const markers: RailMarker[] = drops.map(({ deal, state }) => ({
    at: Date.parse(deal.slotStart),
    className: STYLE[state],
  }));
  const hours = (range.end - range.start) / 3_600_000;
  const ticks = Math.min(7, Math.max(2, Math.round(hours) + 1));
  const shownStates = [...new Set(drops.map((d) => d.state))];

  return (
    <section aria-label="Drops in the window" className="space-y-1.5">
      <RailAxis range={range} count={ticks} format={formatHuntTick} />
      <TimeRail
        range={range}
        start={range.start}
        end={range.end}
        now={now}
        upcoming={now < range.start}
        markers={markers}
        label={[
          `Window ${formatHuntWindow(campaign.windowStart, campaign.windowEnd)}.`,
          ...drops.map(
            ({ deal, state }) =>
              `${formatHuntClock(deal.slotStart)}, ${deal.productName ?? "item"}: ${LABEL[state]}.`,
          ),
        ].join(" ")}
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {shownStates.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <i aria-hidden className={`inline-block size-2.5 rounded-[3px] ${STYLE[s]}`} />
            {LABEL[s]}
          </span>
        ))}
        <span>Times in WAT.</span>
      </div>
    </section>
  );
}
