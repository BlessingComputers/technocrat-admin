"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMonitorStats } from "../api/monitor.queries";
import { MonitorAccessGate } from "./monitor-access-gate";
import { MonitorNavTabs } from "./monitor-nav-tabs";
import { MonitorStatsSkeleton } from "./monitor-skeletons";
import { MonitorUnavailable, isMonitorUnavailableError } from "./monitor-unavailable";
import { StatsBar } from "@/components/shared/stats-bar";
import { StatsKpiCard } from "./stats-kpi-card";
import { RequestsPerMinuteChart } from "./stats/requests-per-minute-chart";
import { TopRoutesList } from "./stats/top-routes-list";
import type { MonitorStatsParams } from "../types/monitor";

const WINDOW_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Last hour" },
  { value: "6", label: "Last 6 hours" },
  { value: "24", label: "Last 24 hours" },
  { value: "168", label: "Last 7 days" },
];

/** Stats dashboard (route `/security/stats`) — `GET /monitor/stats`. */
export function MonitorStatsView() {
  const [hours, setHours] = useState<MonitorStatsParams["hours"]>(24);
  const { data, isLoading, isError, error, isFetching, refetch } =
    useMonitorStats({ hours });

  return (
    <MonitorAccessGate>
      <div className="space-y-8">
        <PageHeader title="Stats" description="Rolling-window request health at a glance">
          <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        </PageHeader>

        <MonitorNavTabs />

        <Select
          value={String(hours)}
          onValueChange={(val) => setHours(Number(val))}
        >
          <SelectTrigger className="h-12! data-[size=default]:h-12 px-6 rounded-md border border-border bg-card text-xs font-medium text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/20 min-w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border text-xs font-medium text-foreground">
            {WINDOW_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading ? (
          <MonitorStatsSkeleton />
        ) : isError ? (
          isMonitorUnavailableError(error) ? (
            <MonitorUnavailable onRetry={() => refetch()} />
          ) : (
            <div className="py-20 text-center bg-card rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Stats unavailable
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We hit an error loading stats. Please try again shortly.
              </p>
            </div>
          )
        ) : !data ? null : (
          <div className="space-y-8">
            <StatsBar columns={5}>
              <StatsKpiCard
                title="Total requests"
                value={data.requests.total.toLocaleString()}
                icon="solar:list-linear"
              />
              <StatsKpiCard
                title="Errors"
                value={data.requests.errorCount.toLocaleString()}
                description={`${data.requests.fivexxCount} were 5xx`}
                icon="solar:danger-circle-linear"
                tone="danger"
              />
              <StatsKpiCard
                title="Error rate"
                value={`${data.requests.errorRate.toFixed(2)}%`}
                icon="solar:chart-2-linear"
                tone={data.requests.errorRate > 1 ? "warning" : "success"}
              />
              <StatsKpiCard
                title="Avg latency"
                value={`${data.latency.avg.toFixed(0)}ms`}
                icon="solar:clock-circle-linear"
              />
              <StatsKpiCard
                title="Max latency"
                value={`${data.latency.max.toLocaleString()}ms`}
                description={`min ${data.latency.min}ms`}
                icon="solar:bolt-linear"
                tone="warning"
              />
            </StatsBar>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                  Requests — last 60 minutes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RequestsPerMinuteChart points={data.requestsPerMinute} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                    Top Slow Routes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopRoutesList variant="slow" rows={data.topSlowRoutes} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                    Top Error Routes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopRoutesList variant="error" rows={data.topErrorRoutes} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MonitorAccessGate>
  );
}
