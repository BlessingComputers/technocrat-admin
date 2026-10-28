// How a hunt deal reads on the monitor and the winners table.
//
// Everything here is pure and takes `now`, so the labels can be tested at the
// exact minutes that matter: before the reveal, inside the slot, and either
// side of a hold's 15-minute deadline.

import type { HuntCampaign, HuntDeal } from "../types/hunts";
import { formatHuntClock } from "./hunt-time";

/**
 * How long an unpaid hold lasts before the backend gives the item back.
 * Mirrors `HOLD_TIMEOUT_MS` in `huntClaim.service.ts` (backend `eb45ded`);
 * there is no field carrying it, so if the backend changes it this must too.
 */
export const HOLD_TIMEOUT_MS = 15 * 60_000;

/** The two `releaseReason` codes the backend writes itself. */
export const RELEASE_PAYMENT_FAILED = "PAYMENT_FAILED";
export const RELEASE_HOLD_TIMEOUT = "HOLD_TIMEOUT";

const ms = (iso: string) => new Date(iso).getTime();

/** Drops by slot start. The backend already sorts them; this does not rely on it. */
export function slotsInOrder(deals: HuntDeal[]): HuntDeal[] {
  return [...deals].sort((a, b) => ms(a.slotStart) - ms(b.slotStart));
}

/**
 * ```
 * secret    before revealAt. Customers see nothing about this drop.
 * revealed  revealAt to slotStart. The public page counts down to it.
 * live      slotStart to slotEnd. The hunt price is on and claimable.
 * over      after slotEnd.
 * ```
 * The slot's own timestamps are the authority, as they are in the backend's
 * claim check, not the campaign status.
 */
export type SlotPhase = "secret" | "revealed" | "live" | "over";

export function slotPhase(deal: HuntDeal, now: number): SlotPhase {
  if (now < ms(deal.revealAt)) return "secret";
  if (now < ms(deal.slotStart)) return "revealed";
  if (now < ms(deal.slotEnd)) return "live";
  return "over";
}

/** The drop that is open right now, if any. */
export function currentSlot(deals: HuntDeal[], now: number): HuntDeal | undefined {
  return slotsInOrder(deals).find((d) => slotPhase(d, now) === "live");
}

/** The next drop still to open, if any. */
export function nextDrop(deals: HuntDeal[], now: number): HuntDeal | undefined {
  return slotsInOrder(deals).find((d) => ms(d.slotStart) > now);
}

/** How long after `slotStart` the start job gets before a missing rule counts as failed. */
const START_GRACE_MS = 60_000;

/**
 * True when a drop's slot has opened but its discount never became a rule.
 *
 * `discountApplied` says whether the Deal's markup rule exists. The start
 * writes it at `slotStart`, so false a minute later means the start skipped
 * this target, most often on `MARKUP_RULE_SCOPE_CONFLICT` with a standing rule
 * on the product. The item was then on offer at full price.
 *
 * Since backend `e6999ee`, `markupPercentage` is the stored target and stays
 * negative whether or not the rule exists, so it no longer carries this signal.
 * A backend from before that commit sends no `discountApplied` and reports 0
 * for a missing rule, hence the fallback.
 */
export function discountNeverApplied(deal: HuntDeal, now: number): boolean {
  const applied = deal.discountApplied ?? deal.markupPercentage < 0;
  return !applied && now >= ms(deal.slotStart) + START_GRACE_MS;
}

/** When an unpaid hold goes back to OPEN: `heldAt` plus 15 minutes. */
export function holdDeadline(heldAt: string): number {
  return ms(heldAt) + HOLD_TIMEOUT_MS;
}

export type ClaimTone = "success" | "warning" | "info" | "muted";

export interface ClaimLine {
  text: string;
  tone: ClaimTone;
}

/**
 * One line saying where this drop stands.
 *
 * HELD and CLAIMED must not read alike. HELD is a staff problem with a clock
 * on it: the release time is the deadline for any phone call, because after it
 * the backend frees the item and, with the slot long closed, it goes unsold.
 */
export function claimLine(deal: HuntDeal, now: number): ClaimLine {
  const holder = deal.heldByCustomerName?.trim() || "a customer";

  if (deal.claimStatus === "CLAIMED") {
    return { text: `Won by ${holder}, paid`, tone: "success" };
  }

  if (deal.claimStatus === "HELD") {
    if (!deal.heldAt) {
      return { text: `Held by ${holder}, awaiting payment`, tone: "warning" };
    }
    const deadline = holdDeadline(deal.heldAt);
    return deadline > now
      ? {
          text: `Held by ${holder}, awaiting payment, releases at ${formatHuntClock(deadline)}`,
          tone: "warning",
        }
      : {
          text: `Held by ${holder}, unpaid. The hold ran out at ${formatHuntClock(deadline)} and is being released`,
          tone: "warning",
        };
  }

  switch (slotPhase(deal, now)) {
    case "secret":
      return {
        text: `Secret. The countdown goes public at ${formatHuntClock(deal.revealAt)}`,
        tone: "muted",
      };
    case "revealed":
      return {
        text: `Countdown is public. Drops at ${formatHuntClock(deal.slotStart)}`,
        tone: "info",
      };
    case "live":
      return { text: "Live now. Nobody has claimed it yet", tone: "info" };
    case "over":
      return { text: "Not won. The drop closed unclaimed", tone: "muted" };
  }
}

export interface ReleaseNote {
  text: string;
  at: string;
}

/**
 * Why this drop was last released, or null if it never was.
 *
 * Kept even when the drop is HELD again: a release clears the holder but not
 * `releasedAt`, so the history survives a second claim. The two system codes
 * get plain words; anything else is a staff member's own reason, quoted. There
 * is no field naming which staff member it was.
 */
export function releaseNote(deal: HuntDeal): ReleaseNote | null {
  if (!deal.releasedAt) return null;
  const reason = deal.releaseReason?.trim();
  const text =
    reason === RELEASE_PAYMENT_FAILED
      ? "Released automatically: payment failed"
      : reason === RELEASE_HOLD_TIMEOUT
        ? "Released automatically: the winner did not finish in time"
        : reason
          ? `Released by staff: “${reason}”`
          : "Released";
  return { text, at: deal.releasedAt };
}

/** How many drops are claimed and held, out of how many. */
export function claimCounts(deals: HuntDeal[]) {
  return {
    total: deals.length,
    claimed: deals.filter((d) => d.claimStatus === "CLAIMED").length,
    held: deals.filter((d) => d.claimStatus === "HELD").length,
  };
}

/** A claim staff may need to chase: somebody holds it and the order is not PAID. */
export function isUnpaidClaim(deal: HuntDeal): boolean {
  return deal.claimStatus !== "OPEN" && deal.orderPaymentStatus !== "PAID";
}

function winnerRank(deal: HuntDeal): number {
  if (isUnpaidClaim(deal)) return 0;
  if (deal.claimStatus !== "OPEN") return 1;
  return 2;
}

/** Winners table order: unpaid claims first, then paid, then unsold, each by slot. */
export function sortForWinners(deals: HuntDeal[]): HuntDeal[] {
  return [...deals].sort(
    (a, b) => winnerRank(a) - winnerRank(b) || ms(a.slotStart) - ms(b.slotStart),
  );
}

/**
 * Whether the detail page should poll.
 *
 * ACTIVE, plus two edges where the server's state is still moving: a SCHEDULED
 * campaign whose window has opened (the flip to ACTIVE is due), and an ENDED
 * one with a hold still running out. A campaign with nothing left to change is
 * not polled.
 */
export function isMonitorLive(campaign: HuntCampaign, now: number): boolean {
  if (campaign.status === "ACTIVE") return true;
  if (campaign.status === "SCHEDULED") return ms(campaign.windowStart) <= now;
  if (campaign.status === "ENDED") {
    return campaign.huntDeals.some((d) => d.claimStatus === "HELD");
  }
  return false;
}

export type PaymentTone = "success" | "warning" | "danger" | "info" | "muted";

/** Badge tone for a gateway order's payment status. */
export function paymentTone(status: string | null): PaymentTone {
  switch (status?.toUpperCase()) {
    case "PAID":
      return "success";
    case "FAILED":
      return "danger";
    case "REFUNDED":
      return "info";
    case "PENDING":
      return "warning";
    default:
      return "muted";
  }
}

/** "Paid", "Pending", or the raw status in sentence case for anything newer. */
export function paymentLabel(status: string | null): string {
  if (!status) return "No order";
  const lower = status.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
