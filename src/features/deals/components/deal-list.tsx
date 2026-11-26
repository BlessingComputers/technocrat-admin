import type { ReactNode } from "react";
import Link from "next/link";

import { AppIcon } from "@/components/shared/app-icon";
import { SkeletonRows } from "@/components/shared/skeletons";
import { TimeRail } from "@/components/shared/time-rail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

import { failedTargetCount, sharedDiscountMagnitude, type Deal } from "../types/deals";
import { dealWindow, timingLine, type DealGroups } from "../utils/deal-groups";
import { targetMixLabel } from "../utils/deal-scope";

export interface EndedDeals {
  deals: Deal[];
  /** From the first page's meta; null while it loads. */
  total: number | null;
  hasMore: boolean;
  isFetchingMore: boolean;
  onMore: () => void;
}

interface DealListProps {
  groups: DealGroups;
  ended: EndedDeals;
  selectedId: string | null;
  now: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  showEnded: boolean;
  onShowEnded: () => void;
}

const hrefFor = (id: string) => `/pricing/deals?deal=${encodeURIComponent(id)}`;

/** The left card: deals in groups, ended folded at the bottom (spec, Deals). */
export function DealList(props: DealListProps) {
  const { groups, ended, selectedId, now } = props;

  if (props.isLoading) {
    return (
      <Card className="p-3">
        <SkeletonRows rows={5} rowHeight="h-14" />
      </Card>
    );
  }
  if (props.isError) {
    return (
      <Card className="items-center gap-3 px-4 py-10 text-center">
        <AppIcon icon="solar:danger-circle-linear" className="size-8 text-destructive-ink" />
        <p className="text-sm font-semibold">Couldn’t load deals</p>
        <p className="text-xs text-muted-foreground">This needs the discounts:read permission.</p>
        <Button variant="outline" onClick={props.onRetry}>
          Retry
        </Button>
      </Card>
    );
  }

  const row = (deal: Deal) => (
    <DealRow key={deal.id} deal={deal} now={now} selected={deal.id === selectedId} />
  );
  const open = groups.running.length + groups.comingUp.length + groups.drafts.length;

  return (
    <Card className="gap-0 p-1.5">
      {/* Without this line an empty list is a blank card, or a lone "Show
          ended" button with a top rule over nothing. */}
      {open === 0 && (
        <p className="px-3 py-8 text-center text-xs text-muted-foreground">
          {ended.total === 0 ? "No deals yet." : "Nothing running, coming up or in draft."}
        </p>
      )}
      <Group label="Running now" count={groups.running.length}>{groups.running.map(row)}</Group>
      <Group label="Coming up" count={groups.comingUp.length}>{groups.comingUp.map(row)}</Group>
      <Group label="Drafts" count={groups.drafts.length}>{groups.drafts.map(row)}</Group>

      {!props.showEnded ? (
        ended.total ? (
          <button
            type="button"
            onClick={props.onShowEnded}
            className="mt-1.5 rounded-lg border-t border-border px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Show ended deals ({ended.total})
          </button>
        ) : null
      ) : (
        <Group label="Ended" count={ended.total ?? ended.deals.length}>
          {ended.deals.map(row)}
          {ended.hasMore && (
            <button
              type="button"
              onClick={ended.onMore}
              disabled={ended.isFetchingMore}
              className="w-full rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
            >
              {ended.isFetchingMore ? "Loading…" : "Show 20 more"}
            </button>
          )}
        </Group>
      )}
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

function DealRow({ deal, now, selected }: { deal: Deal; now: number; selected: boolean }) {
  const discount = sharedDiscountMagnitude(deal.targets);
  const failed = failedTargetCount(deal);
  const window = deal.status === "ACTIVE" ? dealWindow(deal) : null;

  return (
    <Link
      href={hrefFor(deal.id)}
      scroll={false}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "block rounded-lg px-3 py-2.5 outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring",
        selected && "bg-primary/[0.06] shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/[0.08]",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-semibold" title={deal.name}>
          {deal.name}
        </span>
        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
          {discount === null ? "Mixed" : `−${discount}%`}
        </span>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {timingLine(deal, now)} · {targetMixLabel(deal.targets)}
      </p>
      {failed !== null && failed > 0 && (
        <p className="mt-0.5 text-xs font-semibold text-warning-ink">
          {failed} of {deal.targets.length} never started
        </p>
      )}
      {window && window.end !== null && (
        <TimeRail
          range={{ start: window.start, end: window.end }}
          start={window.start}
          end={window.end}
          now={now}
          label={timingLine(deal, now)}
          className="mt-1"
        />
      )}
    </Link>
  );
}
