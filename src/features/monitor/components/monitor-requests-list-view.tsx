"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useMonitorRequests } from "../api/monitor.queries";
import { MonitorAccessGate } from "./monitor-access-gate";
import { MonitorNavTabs } from "./monitor-nav-tabs";
import { MonitorFilterBar } from "./monitor-filter-bar";
import { LogTable } from "./log-table";
import { MonitorPagination } from "./monitor-pagination";
import type { MonitorRequestsParams } from "../types/monitor";

const DEFAULT_PARAMS: MonitorRequestsParams = { page: 1, limit: 25 };

/**
 * Monitor requests list (route `/security`) — `GET /monitor/requests`. Lives
 * inside the Security section (replacing its placeholder) rather than as its
 * own nav item, since request/error/anomaly monitoring *is* the Security
 * module's content, not a sibling feature.
 * SUPER_ADMIN only, both by backend enforcement and `MonitorAccessGate` here.
 */
export function MonitorRequestsListView() {
  const [params, setParams] = useState<MonitorRequestsParams>(DEFAULT_PARAMS);

  const { rows, meta, isLoading, isError, error, isFetching, refetch } =
    useMonitorRequests(params);

  const updateFilters = (next: MonitorRequestsParams) =>
    setParams({ ...next, page: 1 });

  return (
    <MonitorAccessGate>
      <div className="space-y-8">
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
        />

        {meta && meta.totalPages > 1 && (
          <MonitorPagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(p) => setParams({ ...params, page: p })}
          />
        )}
      </div>
    </MonitorAccessGate>
  );
}
