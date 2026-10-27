"use client";

import { useState } from "react";
import Link from "next/link";

import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePermissions } from "@/lib/auth/use-permissions";
import { cn } from "@/lib/utils/cn";

import { useHuntCampaigns } from "../api/hunts.queries";
import type { HuntCampaignStatus } from "../types/hunts";
import { HuntsTable } from "./hunts-table";

/** No Draft chip: the create route never makes one. A stray draft still shows under All. */
const FILTERS: { value: HuntCampaignStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ACTIVE", label: "Active" },
  { value: "ENDED", label: "Ended" },
];

/**
 * `/pricing/hunts`: every treasure-hunt campaign.
 *
 * `GET /hunt-campaigns` is not paged, so the whole list is already in hand and
 * the status chips filter it here. That also makes each chip's count free,
 * which Deals cannot offer.
 */
export function HuntsListView() {
  const [filter, setFilter] = useState<HuntCampaignStatus | "ALL">("ALL");
  const { can } = usePermissions();
  const {
    data: campaigns = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useHuntCampaigns();

  const countOf = (value: HuntCampaignStatus | "ALL") =>
    value === "ALL"
      ? campaigns.length
      : campaigns.filter((c) => c.status === value).length;

  const shown =
    filter === "ALL" ? campaigns : campaigns.filter((c) => c.status === filter);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Treasure hunts"
        description="Secret five-minute drops inside a public window. Each drop sells one unit of one product."
      >
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        {can("huntCampaigns:write") && (
          <Button asChild className="h-10 rounded-lg font-semibold">
            <Link href="/pricing/hunts/new">
              <AppIcon icon="solar:add-circle-linear" className="mr-2 size-4" />
              New campaign
            </Link>
          </Button>
        )}
      </PageHeader>

      <div
        role="tablist"
        aria-label="Campaign status"
        className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/30 p-1"
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-3.5 text-sm font-semibold transition-colors",
              filter === f.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            {!isLoading && !isError && (
              <span className="font-mono text-xs tabular-nums opacity-60">
                {countOf(f.value)}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <HuntsTable
          campaigns={shown}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          isFiltered={filter !== "ALL"}
        />
      </Card>
    </div>
  );
}
