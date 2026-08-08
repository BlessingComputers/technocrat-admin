"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMonitorAnomalies } from "../api/monitor.queries";
import { MonitorAccessGate } from "./monitor-access-gate";
import { MonitorNavTabs } from "./monitor-nav-tabs";
import { MonitorAnomaliesSkeleton } from "./monitor-skeletons";
import { MonitorUnavailable, isMonitorUnavailableError } from "./monitor-unavailable";
import { AnomalyCard } from "./anomaly-card";
import type { MonitorAnomaliesParams } from "../types/monitor";

const DEFAULT_PARAMS: MonitorAnomaliesParams = { limit: 50 };

/**
 * Anomaly history (route `/security/anomalies`) — `GET /monitor/anomalies`
 * returns a flat, capped array (no pagination `meta`), so this is a card list
 * rather than a paginated table.
 */
export function MonitorAnomaliesListView() {
  const [params, setParams] = useState<MonitorAnomaliesParams>(DEFAULT_PARAMS);
  const { anomalies, isLoading, isError, error, isFetching, refetch } =
    useMonitorAnomalies(params);

  return (
    <MonitorAccessGate>
      <div className="space-y-8">
        <PageHeader
          title="Anomalies"
          description="Error-rate and latency spikes detected against the 24-hour rolling baseline"
        >
          <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        </PageHeader>

        <MonitorNavTabs />

        <Select
          value={params.type ?? "ALL"}
          onValueChange={(val) =>
            setParams({
              ...params,
              type:
                val === "ALL"
                  ? undefined
                  : (val as MonitorAnomaliesParams["type"]),
            })
          }
        >
          <SelectTrigger className="h-12! data-[size=default]:h-12 px-6 rounded-md border border-border bg-card text-xs font-medium text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/20 min-w-[220px]">
            <SelectValue placeholder="All Anomaly Types" />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border text-xs font-medium text-foreground">
            <SelectItem value="ALL">All Anomaly Types</SelectItem>
            <SelectItem value="error_rate_spike">Error rate spike</SelectItem>
            <SelectItem value="latency_spike">Latency spike</SelectItem>
          </SelectContent>
        </Select>

        {isLoading ? (
          <MonitorAnomaliesSkeleton />
        ) : isError ? (
          isMonitorUnavailableError(error) ? (
            <MonitorUnavailable onRetry={() => refetch()} />
          ) : (
            <div className="py-20 text-center bg-card rounded-lg border border-border">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AppIcon icon="solar:danger-circle-linear" className="size-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Anomalies unavailable
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We hit an error loading anomalies. Please try again shortly.
              </p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          )
        ) : anomalies.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-lg border border-border">
            <AppIcon
              icon="solar:shield-check-linear"
              className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-foreground">
              No anomalies detected
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Error rate and latency are within the 24-hour baseline
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {anomalies.map((anomaly, i) => (
              <AnomalyCard key={`${anomaly.timestamp}-${i}`} anomaly={anomaly} />
            ))}
          </div>
        )}
      </div>
    </MonitorAccessGate>
  );
}
