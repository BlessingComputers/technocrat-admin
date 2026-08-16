"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPrice } from "@/lib/utils/format";
import { AnalyticsChartCard } from "./analytics-chart-card";
import { ChartEmpty, ChartLoading } from "./chart-states";
import { useRevenueAnalytics } from "../api/analytics.queries";
import { compactPrice, formatChartDate } from "../utils/format-chart";
import type { AnalyticsPeriod } from "../types/chart-analytics";
import { MetaLabel } from "@/components/shared/meta-label";

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Hero revenue trend (area) over the selected window; deep-links to orders. */
export function RevenueTrendChart({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useRevenueAnalytics({ period });
  const points = data?.dataPoints ?? [];

  return (
    <AnalyticsChartCard
      title="Revenue"
      subtitle={`${(data?.totalOrders ?? 0).toLocaleString()} orders · ${formatPrice(
        data?.avgOrderValue ?? 0,
      )} avg order`}
      icon="solar:chart-2-bold"
      iconClass="bg-primary/10 text-primary-ink"
      headerRight={
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatPrice(data?.totalRevenue ?? 0)}
          </p>
          <MetaLabel className="block">
            Total · {period.toUpperCase()}
          </MetaLabel>
        </div>
      }
      href="/orders"
      linkLabel="View all orders"
    >
      {isLoading ? (
        <ChartLoading className="h-[240px]" />
      ) : points.length === 0 ? (
        <ChartEmpty className="h-[240px]" />
      ) : (
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
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
              width={48}
              tickFormatter={(v) => compactPrice(Number(v))}
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(l) => formatChartDate(String(l))}
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatPrice(Number(value))}
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              fill="url(#fillRevenue)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </AnalyticsChartCard>
  );
}
