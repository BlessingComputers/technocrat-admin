"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useMonitorSlow } from "../api/monitor.queries";
import { MonitorAccessGate } from "./monitor-access-gate";
import { MonitorNavTabs } from "./monitor-nav-tabs";
import { MonitorSimpleFilterBar } from "./monitor-simple-filter-bar";
import { LogTable } from "./log-table";
import { MonitorBackToTop } from "./monitor-back-to-top";
import { useScrollToTop } from "../hooks/use-scroll-to-top";
import type { MonitorErrorsOrSlowParams } from "../types/monitor";

/** No `page` here - the infinite query owns paging; this is filters only. */
const DEFAULT_PARAMS: MonitorErrorsOrSlowParams = { limit: 25 };

/** Monitor slow-requests list (route `/security/slow`) — `GET /monitor/slow`,
 * a shortcut for `?tag=slow` (duration over `MONITOR_SLOW_MS`, default 2000ms). */
export function MonitorSlowListView() {
  const [params, setParams] = useState<MonitorErrorsOrSlowParams>(DEFAULT_PARAMS);

  const {
    rows,
    total,
    isLoading,
    isError,
    error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useMonitorSlow(params);

  const { anchorRef, scrollToTop } = useScrollToTop();

  /** A filter change restarts the stream at page 1, so send the reader back to
   * the top rather than leaving them scrolled past the end of a shorter list. */
  const updateFilters = (next: MonitorErrorsOrSlowParams) => {
    setParams(next);
    scrollToTop();
  };

  return (
    <MonitorAccessGate>
      <div ref={anchorRef} className="space-y-8">
        <PageHeader
          title="Slow requests"
          description="Requests that exceeded the slow-request threshold, sorted newest first"
        >
          <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        </PageHeader>

        <MonitorNavTabs />

        <MonitorSimpleFilterBar
          params={params}
          onParamsChange={updateFilters}
        />

        <LogTable
          logs={rows}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyMessage="No slow requests found"
          total={total}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />

        <MonitorBackToTop />
      </div>
    </MonitorAccessGate>
  );
}
