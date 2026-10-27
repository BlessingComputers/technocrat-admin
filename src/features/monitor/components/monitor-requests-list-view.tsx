"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useMonitorRequests } from "../api/monitor.queries";
import { MonitorAccessGate } from "./monitor-access-gate";
import { MonitorNavTabs } from "./monitor-nav-tabs";
import { MonitorFilterBar } from "./monitor-filter-bar";
import { LogTable } from "./log-table";
import { MonitorBackToTop } from "./monitor-back-to-top";
import { useScrollToTop } from "../hooks/use-scroll-to-top";
import type { MonitorRequestsParams } from "../types/monitor";

/** No `page` here — the infinite query owns paging; this is filters only. */
const DEFAULT_PARAMS: MonitorRequestsParams = { limit: 25 };

/**
 * Monitor requests list (route `/security`) — `GET /monitor/requests`. Lives
 * inside the Security section (replacing its placeholder) rather than as its
 * own nav item, since request/error/anomaly monitoring *is* the Security
 * module's content, not a sibling feature.
 * SUPER_ADMIN only, both by backend enforcement and `MonitorAccessGate` here.
 *
 * The log reads as one continuous stream: pages append on scroll, fetched a
 * screen and a half ahead of the reader (see `useInfiniteScroll`).
 */
export function MonitorRequestsListView() {
  const [params, setParams] = useState<MonitorRequestsParams>(DEFAULT_PARAMS);

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
  } = useMonitorRequests(params);

  const { anchorRef, scrollToTop } = useScrollToTop();

  /** A filter change restarts the stream at page 1, so send the reader back to
   * the top rather than leaving them scrolled past the end of a shorter list. */
  const updateFilters = (next: MonitorRequestsParams) => {
    setParams(next);
    scrollToTop();
  };

  return (
    <MonitorAccessGate>
      <div ref={anchorRef} className="space-y-8">
        <PageHeader
          title="Security"
          description="Every logged HTTP request and SYSTEM event — filter by path, method, tag, or duration"
        >
          <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        </PageHeader>

        <MonitorNavTabs />

        <MonitorFilterBar params={params} onParamsChange={updateFilters} />

        <LogTable
          logs={rows}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
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
