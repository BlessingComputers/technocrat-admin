"use client";

import { useState } from "react";
import Link from "next/link";

import { RefreshButton } from "@/components/shared/refresh-button";
import { AppIcon } from "@/components/shared/app-icon";
import { SkeletonRows } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/error";
import { usePermissions } from "@/lib/auth/use-permissions";

import {
  HUNT_POLL_MS,
  useHuntCampaign,
  useHuntDealPercentages,
  useHuntProductPricing,
} from "../api/hunts.queries";
import { useNow } from "../hooks/use-now";
import type { HuntCampaign, HuntDeal } from "../types/hunts";
import {
  canDeleteCampaign,
  claimCounts,
  currentSlot,
  isMonitorLive,
  isUnpaidClaim,
  nextDrop,
} from "../utils/hunt-rows";
import {
  formatHuntClock,
  formatHuntDistance,
  formatHuntTime,
  formatHuntWindow,
  sameHuntDay,
} from "../utils/hunt-time";
import { HuntDeleteDialog } from "./hunt-delete-dialog";
import { HuntDropActions } from "./hunt-drop-actions";
import { HuntSlotList } from "./hunt-slot-list";
import { HuntStatusBadge } from "./hunt-status-badge";
import { HuntWindowRail } from "./hunt-window-rail";
import { HuntWinnersTable } from "./hunt-winners-table";

/**
 * The right panel of `/pricing/hunts?campaign=<id>`: one campaign, three states.
 *
 * SCHEDULED shows the secret schedule. ACTIVE is the same list as a live
 * monitor, polled every 15 seconds, with the open slot marked. ENDED swaps the
 * list for the winners table, unpaid claims first. The form and the release
 * live on their own pages. Deleting a campaign or removing a drop happens here.
 */
export function HuntDetailView({ campaignId }: { campaignId: string }) {
  const { data: campaign, isLoading, isError, error, refetch, isFetching } =
    useHuntCampaign(campaignId);
  const deals = campaign?.huntDeals ?? [];
  const pricing = useHuntProductPricing(
    deals.flatMap((d) => (d.productId ? [d.productId] : [])),
  );
  const stored = useHuntDealPercentages(deals);
  const now = useNow(HUNT_POLL_MS);
  const { can } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-5">
        <SkeletonRows rows={5} rowHeight="h-12" />
      </Card>
    );
  }

  if (isError || !campaign) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Card className="items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AppIcon icon="solar:gift-linear" className="size-7" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {notFound ? "That campaign is gone" : "Couldn’t load this campaign"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {notFound
              ? "It may have been deleted, or created against a different environment."
              : "Reading a campaign needs the huntCampaigns:read permission."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
          <Button asChild variant="ghost">
            <Link href="/pricing/hunts">Back to hunts</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const ended = campaign.status === "ENDED";
  const polling = isMonitorLive(campaign, now);
  const withDate = !sameHuntDay(campaign.windowStart, campaign.windowEnd);
  const canWrite = can("huntCampaigns:write");
  const listProps = {
    actionsFor: canWrite
      ? (deal: HuntDeal) => (
          <HuntDropActions campaign={campaign} deal={deal} now={now} />
        )
      : undefined,
    deals: campaign.huntDeals,
    pricing: pricing.pricing,
    storedPercentages: stored.byDeal,
    pricesLoading: pricing.isLoading || stored.isLoading,
    now,
    withDate,
  };

  return (
    <Card className="gap-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2.5 text-lg font-semibold tracking-tight">
            {campaign.name}
            <HuntStatusBadge status={campaign.status} />
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {campaign.campaignId} · created {formatHuntTime(campaign.createdAt)}
          </p>
        </div>
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        {canWrite && canDeleteCampaign(campaign) && (
          <Button
            variant="outline"
            onClick={() => setIsDeleting(true)}
            className="h-10 rounded-lg font-medium text-destructive-ink"
          >
            <AppIcon icon="solar:trash-bin-trash-linear" className="mr-2 size-4" />
            Delete
          </Button>
        )}
        {/* The backend refuses edits once ACTIVE or ENDED, so there is no
            button to press then. */}
        {(campaign.status === "SCHEDULED" || campaign.status === "DRAFT") &&
          canWrite && (
            <Button asChild className="h-10 rounded-lg font-semibold">
              <Link href={`/pricing/hunts/${campaign.id}/edit`}>
                <AppIcon icon="solar:pen-2-linear" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          )}
      </div>

      <HuntDeleteDialog
        campaign={campaign}
        open={isDeleting}
        onOpenChange={setIsDeleting}
      />

      {!ended && <SecretScheduleNotice />}

      <HuntWindowRail campaign={campaign} now={now} />

      <CampaignSummary campaign={campaign} now={now} />

      {polling && (
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <AppIcon icon="solar:pulse-linear" className="size-4 text-success-ink" />
          Live monitor. Refreshes every 15 seconds.
        </p>
      )}

      {ended ? <HuntWinnersTable {...listProps} /> : <HuntSlotList {...listProps} />}
    </Card>
  );
}

/** The facts above the list: the public window, what drops next, and claims. */
function CampaignSummary({ campaign, now }: { campaign: HuntCampaign; now: number }) {
  const deals = campaign.huntDeals;
  const { total, claimed, held } = claimCounts(deals);
  const live = currentSlot(deals, now);
  const next = nextDrop(deals, now);
  const unpaid = deals.filter(isUnpaidClaim).length;

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
      <Fact label="Window">
        {formatHuntWindow(campaign.windowStart, campaign.windowEnd)}
        <Note>{windowNote(campaign, now)}</Note>
      </Fact>

      {campaign.status === "ENDED" ? (
        <Fact label="Unpaid">
          {unpaid === 0 ? "None" : `${unpaid} to chase`}
          <Note>
            {unpaid === 0
              ? "Every claim is paid, or nothing was claimed."
              : "Listed first in the winners table."}
          </Note>
        </Fact>
      ) : (
        <Fact label="Next drop">
          {live ? (
            <>
              Live now
              <Note>
                {live.productName ?? "The item"} closes at{" "}
                {formatHuntClock(live.slotEnd)}.
              </Note>
            </>
          ) : next ? (
            <>
              {formatHuntClock(next.slotStart)}
              <Note>
                Drops {formatHuntDistance(next.slotStart, now)}. Its countdown
                goes public at {formatHuntClock(next.revealAt)}.
              </Note>
            </>
          ) : (
            <>
              No more drops
              <Note>Every slot in this window has run.</Note>
            </>
          )}
        </Fact>
      )}

      <Fact label="Claims">
        {claimed} of {total} claimed
        <Note>
          {held > 0
            ? `${held} held, awaiting payment.`
            : "One unit per item."}
        </Note>
      </Fact>
    </div>
  );
}

function windowNote(campaign: HuntCampaign, now: number): string {
  const start = new Date(campaign.windowStart).getTime();
  const end = new Date(campaign.windowEnd).getTime();

  if (campaign.status === "ENDED") {
    return `Closed ${formatHuntDistance(campaign.windowEnd, now)}.`;
  }
  if (now < start) {
    return `Opens ${formatHuntDistance(campaign.windowStart, now)}. The window is public.`;
  }
  if (now < end) {
    return campaign.status === "SCHEDULED"
      ? "Open by the clock. Waiting for the server to mark it Active."
      : `Closes ${formatHuntDistance(campaign.windowEnd, now)}.`;
  }
  return "Past its end. Waiting for the server to close it.";
}

/** Said once, above the schedule, so nobody shares this screen by accident. */
function SecretScheduleNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4"
    >
      <AppIcon
        icon="solar:eye-closed-linear"
        className="mt-0.5 size-5 shrink-0 text-warning-ink"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-warning-ink">
          This is the secret schedule
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          Customers never see these drop times. Each one shows publicly only as
          a countdown from its reveal time. Don’t screenshot this page for
          social.
        </p>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 bg-card p-3">
      <p className="text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-semibold text-foreground">{children}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-0.5 text-xs font-medium text-muted-foreground">{children}</p>
  );
}
