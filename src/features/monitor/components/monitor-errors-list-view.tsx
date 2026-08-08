"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useMonitorErrors } from "../api/monitor.queries";
import { MonitorAccessGate } from "./monitor-access-gate";
import { MonitorNavTabs } from "./monitor-nav-tabs";
import { MonitorSimpleFilterBar } from "./monitor-simple-filter-bar";
import { LogTable } from "./log-table";
import { MonitorPagination } from "./monitor-pagination";
import type { MonitorErrorsOrSlowParams } from "../types/monitor";

const DEFAULT_PARAMS: MonitorErrorsOrSlowParams = { page: 1, limit: 25 };

/** Monitor errors list (route `/security/errors`) — `GET /monitor/errors`,
 * a shortcut for `?tag=5xx,4xx` on the requests list. */
export function MonitorErrorsListView() {
  const [params, setParams] = useState<MonitorErrorsOrSlowParams>(DEFAULT_PARAMS);

  const { rows, meta, isLoading, isError, error, isFetching, refetch } =
    useMonitorErrors(params);

  return (
    <MonitorAccessGate>
      <div className="space-y-8">
        <PageHeader
          title="Errors"
          description="Requests that resulted in a 4xx or 5xx response, sorted newest first"
        >
          <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        </PageHeader>

        <MonitorNavTabs />

        <MonitorSimpleFilterBar
          params={params}
          onParamsChange={(next) => setParams({ ...next, page: 1 })}
        />

        <LogTable
          logs={rows}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          emptyMessage="No errors found"
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
