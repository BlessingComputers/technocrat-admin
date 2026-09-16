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

import type { HuntCampaign } from "../types/hunts";
import { claimCounts } from "../utils/hunt-rows";
import { formatHuntWindow } from "../utils/hunt-time";
import { HuntStatusBadge } from "./hunt-status-badge";

const HEAD = "font-semibold text-xs text-muted-foreground";

interface HuntsTableProps {
  campaigns: HuntCampaign[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** True when a status chip is on, which changes what "nothing here" means. */
  isFiltered: boolean;
}

export function HuntsTable({
  campaigns,
  isLoading,
  isError,
  onRetry,
  isFiltered,
}: HuntsTableProps) {
  // Rendered instead of the table: the shared skeleton emits divs, which a
  // <tbody> cannot hold.
  if (isLoading) {
    return (
      <div className="p-4">
        <SkeletonRows rows={4} rowHeight="h-14" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[760px] table-fixed">
        <TableHeader className="bg-primary/[0.04]">
          <TableRow className="border-b-border/60">
            <TableHead className={`${HEAD} w-[34%]`}>Campaign</TableHead>
            <TableHead className={`${HEAD} w-[32%]`}>Window</TableHead>
            <TableHead className={`${HEAD} w-[14%]`}>Status</TableHead>
            <TableHead className={`${HEAD} w-[20%]`}>Drops</TableHead>
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
                    Couldn’t load campaigns
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This needs the huntCampaigns:read permission. Try again
                    shortly.
                  </p>
                </div>
                <Button variant="outline" onClick={onRetry} className="mt-1">
                  Retry
                </Button>
              </div>
            </StateRow>
          ) : campaigns.length === 0 ? (
            <StateRow compact>
              <AppIcon
                icon="solar:gift-linear"
                className="mx-auto mb-2 size-8 opacity-30"
              />
              <span className="text-xs font-medium text-muted-foreground">
                {isFiltered ? "No campaigns with this status" : "No treasure hunts yet"}
              </span>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground/80">
                {isFiltered
                  ? "Clear the filter to see every campaign."
                  : "A campaign holds a few secret five-minute drops inside a public window."}
              </p>
            </StateRow>
          ) : (
            campaigns.map((campaign) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CampaignRow({ campaign }: { campaign: HuntCampaign }) {
  const { total, claimed, held } = claimCounts(campaign.huntDeals);

  return (
    <TableRow className="border-b-border/40 hover:bg-muted/30">
      <TableCell>
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`/pricing/hunts/${campaign.id}`}
            className="block truncate text-sm font-semibold leading-tight text-foreground hover:underline"
            title={campaign.name}
          >
            {campaign.name}
          </Link>
          <span className="w-fit rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {campaign.campaignId}
          </span>
        </div>
      </TableCell>

      <TableCell className="whitespace-normal text-sm font-medium text-foreground">
        {formatHuntWindow(campaign.windowStart, campaign.windowEnd)}
      </TableCell>

      <TableCell>
        <HuntStatusBadge status={campaign.status} />
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {claimed} of {total} claimed
          </span>
          {held > 0 && (
            <span className="text-xs font-semibold text-warning-ink">
              {held} awaiting payment
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
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
      <TableCell colSpan={4} className={compact ? "h-40 text-center" : "h-[360px]"}>
        {children}
      </TableCell>
    </TableRow>
  );
}
