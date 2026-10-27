"use client";

import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { SkeletonRows } from "@/components/shared/skeletons";

import {
  failedTargetCount,
  sharedDiscountMagnitude,
  type Deal,
} from "../types/deals";
import {
  dealExpiry,
  dealStart,
  formatDealDistance,
  formatDealTime,
} from "../utils/deal-timing";
import { targetMixLabel } from "../utils/deal-scope";
import { DealStatusBadge } from "./deal-status-badge";

const HEAD = "font-semibold text-xs text-muted-foreground";

interface DealsTableProps {
  deals: Deal[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** True when a status filter is on — changes what "nothing here" means. */
  isFiltered: boolean;
}

export function DealsTable({
  deals,
  isLoading,
  isError,
  onRetry,
  isFiltered,
}: DealsTableProps) {
  // Rendered instead of the table, not inside it — the shared skeleton emits
  // divs, which are not valid children of a <tbody>.
  if (isLoading) {
    return (
      <div className="p-4">
        <SkeletonRows rows={5} rowHeight="h-14" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* table-fixed for the same reason the markup table uses it: a long deal
          name would otherwise widen its column and scroll the whole table. */}
      <Table className="min-w-[820px] table-fixed">
        <TableHeader className="bg-primary/[0.04]">
          <TableRow className="border-b-border/60">
            <TableHead className={`${HEAD} w-[30%]`}>Deal</TableHead>
            <TableHead className={`${HEAD} w-[13%]`}>Status</TableHead>
            <TableHead className={`${HEAD} w-[19%]`}>Covers</TableHead>
            <TableHead className={`${HEAD} w-[11%]`}>Discount</TableHead>
            <TableHead className={`${HEAD} w-[27%]`}>Timing</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <StateRow>
              <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
                  <AppIcon icon="solar:danger-circle-linear" className="size-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Couldn’t load deals
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This needs the priceMarkup:read permission. Try again
                    shortly.
                  </p>
                </div>
                <Button variant="outline" onClick={onRetry} className="mt-1">
                  Retry
                </Button>
              </div>
            </StateRow>
          ) : deals.length === 0 ? (
            <StateRow compact>
              <AppIcon
                icon="solar:sale-linear"
                className="mx-auto mb-2 size-8 opacity-30"
              />
              <span className="text-xs font-medium text-muted-foreground">
                {isFiltered ? "No deals with this status" : "No deals yet"}
              </span>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground/80">
                {isFiltered
                  ? "Clear the filter to see every deal."
                  : "A deal is a named sale over any mix of products and parts. Standing markups live next door."}
              </p>
            </StateRow>
          ) : (
            deals.map((deal) => <DealRow key={deal.id} deal={deal} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function DealRow({ deal }: { deal: Deal }) {
  const discount = sharedDiscountMagnitude(deal.targets);
  const failed = failedTargetCount(deal);

  return (
    <TableRow className="border-b-border/40 hover:bg-muted/30">
      <TableCell>
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`/pricing/deals/${deal.id}`}
            className="block truncate text-sm font-semibold leading-tight text-foreground hover:underline"
            title={deal.name}
          >
            {deal.name}
          </Link>
          <span className="w-fit rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {deal.dealId}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <DealStatusBadge status={deal.status} />
      </TableCell>

      <TableCell>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {deal.targets.length} target{deal.targets.length === 1 ? "" : "s"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {targetMixLabel(deal.targets)}
          </span>
          {/* Durable partial-start signal. The per-target errors live only in
              the start response, but the shortfall between targets and live
              rules survives a reload — so the list can still say something
              went wrong days later. */}
          {failed !== null && failed > 0 && (
            <span className="text-xs font-semibold text-warning-ink">
              {failed} of {deal.targets.length} never started
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {discount === null ? (
          <span className="font-sans text-xs font-medium text-muted-foreground">
            Mixed
          </span>
        ) : (
          `−${discount}%`
        )}
      </TableCell>

      <TableCell>
        <TimingCell deal={deal} />
      </TableCell>
    </TableRow>
  );
}

/**
 * When this deal starts, ends, or ended.
 *
 * The case worth the code: an ACTIVE deal whose `expiresAt` has passed. The
 * sweep runs every five minutes, so the row is honestly still Active and the
 * prices are honestly still discounted — for up to five more minutes. Saying
 * "prices updating" is the only truthful reading; hiding it would make the
 * storefront look broken.
 *
 * Nothing here resolves finer than a minute, for the same reason.
 */
function TimingCell({ deal }: { deal: Deal }) {
  const expiry = dealExpiry(deal.expiresAt);
  const start = dealStart(deal.startsAt);

  if (deal.status === "ENDED") {
    return (
      <Muted>
        Ended{" "}
        {expiry.state === "past" ? formatDealDistance(expiry.at) : "manually"}
      </Muted>
    );
  }

  if (deal.status === "SCHEDULED") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          {start.state === "future"
            ? `Starts ${formatDealTime(start.at)}`
            : "Starting shortly"}
        </span>
        <span className="text-xs text-muted-foreground">
          {start.state === "future"
            ? "Prices move on the next five-minute sweep after this."
            : "Waiting on the five-minute sweep."}
        </span>
      </div>
    );
  }

  if (deal.status === "DRAFT") {
    return (
      <Muted>
        {expiry.state === "future"
          ? `Not started · would end ${formatDealTime(expiry.at)}`
          : "Not started · no prices changed"}
      </Muted>
    );
  }

  // ACTIVE
  if (expiry.state === "past") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-warning-ink">
          Ended {formatDealDistance(expiry.at)}
        </span>
        <span className="text-xs text-muted-foreground">
          Prices reset on the next five-minute sweep.
        </span>
      </div>
    );
  }
  if (expiry.state === "future") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          Ends {formatDealDistance(expiry.at)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDealTime(expiry.at)}
        </span>
      </div>
    );
  }
  return <Muted>Runs until you end it</Muted>;
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

function StateRow({
  children,
  compact,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <TableRow>
      <TableCell colSpan={5} className={compact ? "h-40 text-center" : "h-[360px]"}>
        {children}
      </TableCell>
    </TableRow>
  );
}
