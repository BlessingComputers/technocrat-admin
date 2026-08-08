"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AnalyticsChartCard } from "./analytics-chart-card";
import { ChartEmpty, ChartLoading } from "./chart-states";
import { useCustomerAnalytics } from "../api/analytics.queries";
import {
  CHART_SERIES,
  formatChartDate,
  humanizeLabel,
} from "../utils/format-chart";
import type { AnalyticsPeriod } from "../types/chart-analytics";

const chartConfig = {
  count: { label: "New customers", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** New-signup trend (area) + loyalty tiers; deep-links to customers. */
export function CustomersChart({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useCustomerAnalytics({ period });
  const points = data?.dataPoints ?? [];

  const tiers = useMemo(
    () =>
      (data?.loyaltyBreakdown ?? []).map((t, i) => ({
        tier: humanizeLabel(t.tier),
        count: t.count,
        pct: t.pct,
        color: CHART_SERIES[i % CHART_SERIES.length],
      })),
    [data],
  );

  return (
    <AnalyticsChartCard
      title="Customers"
      subtitle={`${(data?.totalCustomers ?? 0).toLocaleString()} total`}
      icon="solar:users-group-rounded-bold"
      iconClass="bg-info/10 text-info"
      headerRight={
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            +{(data?.newCustomers ?? 0).toLocaleString()}
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            New · {period.toUpperCase()}
          </p>
        </div>
      }
      href="/customers"
      linkLabel="View all customers"
    >
      {isLoading ? (
        <ChartLoading className="h-[180px]" />
      ) : points.length === 0 ? (
        <ChartEmpty className="h-[180px]" icon="solar:users-group-rounded-linear" />
      ) : (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={formatChartDate}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(l) => formatChartDate(String(l))}
                />
              }
            />
            <Area
              dataKey="count"
              type="monotone"
              stroke="var(--color-count)"
              strokeWidth={2}
              fill="url(#fillCustomers)"
            />
          </AreaChart>
        </ChartContainer>
      )}

      {tiers.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 pt-4">
          {tiers.map((t) => (
            <div key={t.tier} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: t.color }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {t.tier}
              </span>
              <span className="text-xs font-medium tabular-nums">
                {t.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </AnalyticsChartCard>
  );
}
