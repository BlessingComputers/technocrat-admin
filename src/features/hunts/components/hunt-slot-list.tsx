"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

import { CLAIM_TONE_TEXT, HUNT_PILL } from "../constants/claim-tone";
import type { HuntDeal, HuntProductPricing } from "../types/hunts";
import { resolvePercentage } from "../utils/hunt-price";
import {
  claimLine,
  discountNeverApplied,
  nextDrop,
  releaseNote,
  slotPhase,
  slotsInOrder,
  type SlotPhase,
} from "../utils/hunt-rows";
import { formatHuntClock, formatHuntSlot, formatHuntTime } from "../utils/hunt-time";
import { HuntOrderRef } from "./hunt-order-ref";
import { HuntPriceFigure } from "./hunt-price-figure";
import { UnappliedDiscountLine } from "./unapplied-discount-line";

interface HuntSlotListProps {
  deals: HuntDeal[];
  pricing: Map<string, HuntProductPricing>;
  /** Stored discounts for drops the campaign response reports as 0. */
  storedPercentages: Map<string, number>;
  pricesLoading: boolean;
  now: number;
  /** Put the date on each slot, for a window that crosses midnight. */
  withDate: boolean;
}

/**
 * The drops in time order: the secret schedule before a campaign starts and
 * the live monitor while it runs. The open slot is tinted and marked current,
 * and each row carries its claim state and the holder's order.
 */
export function HuntSlotList({
  deals,
  pricing,
  storedPercentages,
  pricesLoading,
  now,
  withDate,
}: HuntSlotListProps) {
  const slots = slotsInOrder(deals);
  const next = nextDrop(deals, now);

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary/[0.04] px-5 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Drops, in time order
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {slots.length} item{slots.length === 1 ? "" : "s"}, one unit each
        </span>
      </div>

      {slots.length === 0 ? (
        <p className="px-5 py-10 text-center text-xs font-medium text-muted-foreground">
          This campaign has no drops.
        </p>
      ) : (
        <ol className="divide-y divide-border/50">
          {slots.map((deal, index) => (
            <SlotRow
              key={deal.id}
              index={index}
              deal={deal}
              pricing={deal.productId ? pricing.get(deal.productId) : undefined}
              percentage={resolvePercentage(
                deal.markupPercentage,
                storedPercentages.get(deal.dealId),
              )}
              pricesLoading={pricesLoading}
              now={now}
              isNext={next?.id === deal.id}
              withDate={withDate}
            />
          ))}
        </ol>
      )}
    </Card>
  );
}

function SlotRow({
  index,
  deal,
  pricing,
  percentage,
  pricesLoading,
  now,
  isNext,
  withDate,
}: {
  index: number;
  deal: HuntDeal;
  pricing?: HuntProductPricing;
  percentage: number | null;
  pricesLoading: boolean;
  now: number;
  isNext: boolean;
  withDate: boolean;
}) {
  const phase = slotPhase(deal, now);
  const line = claimLine(deal, now);
  const release = releaseNote(deal);
  const live = phase === "live";

  return (
    <li
      aria-current={live ? "true" : undefined}
      className={cn(
        "flex flex-wrap items-start gap-4 px-5 py-4",
        live && "bg-success/[0.07]",
      )}
    >
      <span className="mt-0.5 font-mono text-xs font-semibold text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatHuntSlot(deal.slotStart, deal.slotEnd, withDate)}
          </span>
          <PhaseBadge phase={phase} isNext={isNext} />
        </div>
        <p
          className="truncate text-sm font-medium text-foreground"
          title={deal.productName ?? undefined}
        >
          {deal.productName ?? "Product no longer exists"}
        </p>
        <p className="text-xs text-muted-foreground">
          Countdown public from {formatHuntClock(deal.revealAt)}
        </p>
        <p className={cn("text-xs font-semibold", CLAIM_TONE_TEXT[line.tone])}>
          {line.text}
        </p>
        {discountNeverApplied(deal, now) && <UnappliedDiscountLine />}
        <HuntOrderRef deal={deal} />
        {release && (
          <p className="text-xs text-muted-foreground">
            {release.text}, {formatHuntTime(release.at)}
          </p>
        )}
      </div>

      <HuntPriceFigure
        className="shrink-0 text-right"
        pricing={pricing}
        percentage={percentage}
        isLoading={pricesLoading}
      />
    </li>
  );
}

/** One reveal is public at a time, so "Countdown public" is always the next drop. */
function PhaseBadge({ phase, isNext }: { phase: SlotPhase; isNext: boolean }) {
  switch (phase) {
    case "live":
      return (
        <Badge variant="success" className={HUNT_PILL}>
          Live now
        </Badge>
      );
    case "revealed":
      return (
        <Badge variant="info" className={HUNT_PILL}>
          Countdown public
        </Badge>
      );
    case "secret":
      return isNext ? (
        <Badge variant="info" className={HUNT_PILL}>
          Next drop
        </Badge>
      ) : (
        <Badge variant="muted" className={HUNT_PILL}>
          Secret
        </Badge>
      );
    case "over":
      return (
        <Badge variant="outline" className={HUNT_PILL}>
          Closed
        </Badge>
      );
  }
}
