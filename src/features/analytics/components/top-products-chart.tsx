"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils/cn";
import { AnalyticsChartCard } from "./analytics-chart-card";
import { ChartEmpty, ChartLoading } from "./chart-states";
import { useProductAnalytics } from "../api/analytics.queries";
import { MetaLabel } from "@/components/shared/meta-label";

const chartConfig = {
  totalSales: { label: "Units sold", color: "var(--chart-1)" },
} satisfies ChartConfig;

function truncate(label: string, max = 18) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/** Top sellers (horizontal bars) + stock-health footer; deep-links to products. */
export function TopProductsChart() {
  const { data, isLoading } = useProductAnalytics();

  const items = useMemo(
    () =>
      (data?.topSellingProducts ?? []).slice(0, 6).map((p) => ({
        name: p.productName,
        totalSales: p.totalSales,
        totalRevenue: p.totalRevenue,
      })),
    [data],
  );

  const stockChips = [
    {
      label: "Low stock",
      value: data?.lowStockVariants ?? 0,
      tone: "text-warning-ink",
    },
    {
      label: "Out of stock",
      value: data?.outOfStockVariants ?? 0,
      tone: "text-destructive-ink",
    },
    {
      label: "Discontinued",
      value: data?.discontinuedVariants ?? 0,
      tone: "text-muted-foreground",
    },
    {
      label: "Total variants",
      value: data?.totalVariants ?? 0,
      tone: "text-foreground",
    },
  ];

  return (
    <AnalyticsChartCard
      title="Top Products"
      subtitle="Best sellers by units"
      icon="solar:box-bold"
      iconClass="bg-success/15 text-success-ink"
      href="/catalogues?page=1"
      linkLabel="View catalog"
    >
      {isLoading ? (
        <ChartLoading className="h-[200px]" />
      ) : items.length === 0 ? (
        <ChartEmpty className="h-[200px]" icon="solar:box-linear" />
      ) : (
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            data={items}
            layout="vertical"
            margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={116}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => truncate(String(v))}
              className="text-xs"
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {Number(value).toLocaleString()} sold
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="totalSales"
              fill="var(--color-totalSales)"
              radius={[0, 5, 5, 0]}
              barSize={16}
            />
          </BarChart>
        </ChartContainer>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-4 sm:grid-cols-4">
        {stockChips.map((chip) => (
          <div key={chip.label} className="space-y-0.5">
            <MetaLabel className="block">
              {chip.label}
            </MetaLabel>
            <p className={cn("text-lg font-semibold tabular-nums", chip.tone)}>
              {chip.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </AnalyticsChartCard>
  );
}
