"use client";

import { useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { AppIcon } from "@/components/shared/app-icon";
import {
  DataPagination,
  PAGE_SIZES,
} from "@/components/shared/data-pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePermissions } from "@/lib/auth/use-permissions";
import { cn } from "@/lib/utils/cn";

import { useDeals } from "../api/deals.queries";
import type { DealStatus } from "../types/deals";
import { DealsTable } from "./deals-table";

/** Chip row order: the two you act on first, then the archive. */
const FILTERS: { value: DealStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ACTIVE", label: "Active" },
  { value: "ENDED", label: "Ended" },
];

/**
 * `/pricing/deals`: deals filtered by status and paged, both on the server.
 *
 * `GET /deals` pages since `3d223e3`. The status filter has to go to the
 * server with the page: filtering one page here would say "no active deals" on
 * page 1 while page 3 holds one.
 *
 * The chips carry no per-status counts. The list only knows the total for the
 * filter it asked for, and five extra requests for five numbers is a poor
 * trade. The active chip shows its total; the footer repeats it.
 */
export function DealsListView() {
  const { can } = usePermissions();
  const canWrite = can("priceMarkup:write");

  const [filter, setFilter] = useState<DealStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(PAGE_SIZES[0]);

  const { data, isLoading, isError, isFetching, refetch } = useDeals({
    status: filter === "ALL" ? undefined : filter,
    page,
    limit,
  });
  const deals = data?.data ?? [];
  const meta = data?.meta;

  // The filter can shrink under us (a deal ended in another tab). Step back to
  // the new last page instead of showing an empty one. Adjusting state during
  // render is React's sanctioned alternative to an effect here.
  if (meta && meta.totalPages > 0 && page > meta.totalPages) {
    setPage(meta.totalPages);
  }

  const changeFilter = (next: DealStatus | "ALL") => {
    setFilter(next);
    setPage(1);
  };

  const changeLimit = (next: number) => {
    setLimit(next);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Deals"
        description="Named sales over any mix of products and parts. Standing markups live under Markup."
      >
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        {canWrite && (
          <Button
            asChild
            className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
          >
            <Link href="/pricing/deals/new">
              <AppIcon icon="solar:add-circle-linear" className="mr-2 size-5" />
              New deal
            </Link>
          </Button>
        )}
      </PageHeader>

      <div
        role="tablist"
        aria-label="Deal status"
        className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/30 p-1"
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => changeFilter(f.value)}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-3.5 text-sm font-semibold transition-colors",
              filter === f.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            {filter === f.value && meta && (
              <span className="font-mono text-xs tabular-nums opacity-60">
                {meta.total}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <DealsTable
          deals={deals}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          isFiltered={filter !== "ALL"}
        />
        {meta && meta.total > PAGE_SIZES[0] && (
          <DataPagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={setPage}
            onLimitChange={changeLimit}
            noun="deals"
          />
        )}
      </Card>
    </div>
  );
}
