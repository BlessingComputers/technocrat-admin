import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";

import { AppIcon } from "@/components/shared/app-icon";
import { SkeletonRows } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

import type { HuntCampaign } from "../types/hunts";
import type { CampaignGroups } from "../utils/hunt-groups";
import {
  canDeleteCampaign,
  claimCounts,
  currentSlot,
  isStaleCampaign,
  nextDrop,
} from "../utils/hunt-rows";
import { formatHuntClock, formatHuntWindow } from "../utils/hunt-time";

const hrefFor = (id: string) => `/pricing/hunts?campaign=${encodeURIComponent(id)}`;

/** The left card: campaigns in groups, ended folded (spec, Treasure hunts). */
export function HuntList({
  groups,
  selectedId,
  now,
  isLoading,
  isError,
  onRetry,
}: {
  groups: CampaignGroups;
  selectedId: string | null;
  now: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const [showEnded, setShowEnded] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-3">
        <SkeletonRows rows={4} rowHeight="h-14" />
      </Card>
    );
  }
  if (isError) {
    return (
      <Card className="items-center gap-3 px-4 py-10 text-center">
        <AppIcon icon="solar:danger-circle-linear" className="size-8 text-destructive-ink" />
        <p className="text-sm font-semibold">Couldn’t load campaigns</p>
        <p className="text-xs text-muted-foreground">This needs the huntCampaigns:read permission.</p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </Card>
    );
  }

  const row = (c: HuntCampaign) => (
    <CampaignRow key={c.id} campaign={c} now={now} selected={c.id === selectedId} />
  );
  const empty = !groups.live.length && !groups.scheduled.length && !groups.ended.length;

  return (
    <Card className="gap-0 p-1.5">
      {empty && (
        <p className="px-3 py-8 text-center text-xs text-muted-foreground">No treasure hunts yet.</p>
      )}
      <Group label="Live now" count={groups.live.length}>{groups.live.map(row)}</Group>
      <Group label="Scheduled" count={groups.scheduled.length}>{groups.scheduled.map(row)}</Group>
      {groups.ended.length > 0 &&
        (showEnded ? (
          <Group label="Ended" count={groups.ended.length}>{groups.ended.map(row)}</Group>
        ) : (
          <button
            type="button"
            onClick={() => setShowEnded(true)}
            className="mt-1.5 rounded-lg border-t border-border px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Show ended campaigns ({groups.ended.length})
          </button>
        ))}
    </Card>
  );
}

function Group({ label, count, children }: { label: string; count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <section aria-label={label}>
      <h3 className="flex justify-between px-3 pt-2.5 pb-1 text-xs font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{count}</span>
      </h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function CampaignRow({
  campaign,
  now,
  selected,
}: {
  campaign: HuntCampaign;
  now: number;
  selected: boolean;
}) {
  const { total, claimed, held } = claimCounts(campaign.huntDeals);
  const live = campaign.status === "ACTIVE" ? currentSlot(campaign.huntDeals, now) : undefined;
  const next = campaign.status === "ACTIVE" ? nextDrop(campaign.huntDeals, now) : undefined;

  return (
    <Link
      href={hrefFor(campaign.id)}
      scroll={false}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "block rounded-lg px-3 py-2.5 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
        selected && "bg-primary/[0.06] shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/[0.08]",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-semibold" title={campaign.name}>
          {campaign.name}
        </span>
        <span className="shrink-0 text-xs font-semibold tabular-nums" aria-label={`${claimed} of ${total} claimed`}>
          {claimed}/{total}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {formatHuntWindow(campaign.windowStart, campaign.windowEnd)}
      </p>
      {live ? (
        <p className="mt-0.5 text-xs font-semibold text-info-ink">Drop live now</p>
      ) : next ? (
        <p className="mt-0.5 text-xs text-muted-foreground">Next drop {formatHuntClock(next.slotStart)}</p>
      ) : null}
      {held > 0 && <p className="mt-0.5 text-xs font-semibold text-warning-ink">{held} awaiting payment</p>}
      {isStaleCampaign(campaign, now) && (
        <p className="mt-0.5 text-xs font-semibold text-warning-ink">
          {canDeleteCampaign(campaign)
            ? "Never ran. It will block the next campaign from showing publicly. Delete it."
            : "Past its window and still Scheduled. It can block the next campaign from showing publicly."}
        </p>
      )}
    </Link>
  );
}
