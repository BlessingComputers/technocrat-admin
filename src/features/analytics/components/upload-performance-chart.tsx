"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AppIcon } from "@/components/shared/app-icon";
import { formatChartDate } from "../utils/format-chart";
import { ChartEmpty } from "./chart-states";
import type { UploaderSummary } from "../types/upload-analytics";

const chartConfig = {
  products: { label: "Products", color: "var(--chart-1)" },
  parts: { label: "Parts", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** UTC `YYYY-MM-DD` for a Date (breakdown dates are bucketed in UTC). */
function toUtcDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Ordered list of the last (up to 7) UTC calendar days within `[start, end]`. */
function lastWeekDays(start: string, end: string): string[] {
  const endDate = new Date(`${end}T00:00:00Z`);
  const startDate = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(endDate.getTime()) || Number.isNaN(startDate.getTime())) {
    return [];
  }
  // Start no earlier than 6 days before the window end.
  const windowStart = new Date(
    Math.max(
      startDate.getTime(),
      endDate.getTime() - 6 * 24 * 60 * 60 * 1000,
    ),
  );
  const days: string[] = [];
  for (
    const d = new Date(windowStart);
    d.getTime() <= endDate.getTime();
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    days.push(toUtcDateStr(d));
  }
  return days;
}

/**
 * Team upload volume over the last (up to) 7 days of the queried window as a
 * stacked bar chart — products (green) + parts (jewel) per day, aggregated
 * across every uploader's `dailyBreakdown`. The day axis is zero-filled from the
 * period so sparse activity shows empty slots instead of a single stretched bar.
 */
export function UploadPerformanceChart({
  uploaders,
  period,
}: {
  uploaders: UploaderSummary[];
  period: { start: string; end: string };
}) {
  const rows = useMemo(() => {
    const byDate = new Map<string, { products: number; parts: number }>();
    for (const uploader of uploaders) {
      for (const day of uploader.dailyBreakdown ?? []) {
        const cur = byDate.get(day.date) ?? { products: 0, parts: 0 };
        cur.products += day.products ?? 0;
        cur.parts += day.parts ?? 0;
        byDate.set(day.date, cur);
      }
    }
    return lastWeekDays(period.start, period.end).map((date) => ({
      date,
      products: byDate.get(date)?.products ?? 0,
      parts: byDate.get(date)?.parts ?? 0,
    }));
  }, [uploaders, period.start, period.end]);

  if (rows.length === 0) return null;

  const total = rows.reduce((sum, r) => sum + r.products + r.parts, 0);

  return (
    <div className="border-b border-border px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <AppIcon icon="solar:chart-square-bold" className="size-4 text-primary-ink" />
          Team Uploads · Last {rows.length} {rows.length === 1 ? "day" : "days"}
        </h3>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {total.toLocaleString()} items
        </span>
      </div>
      {total === 0 ? (
        <ChartEmpty
          message="No uploads for this period"
          className="h-[200px]"
        />
      ) : (
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <BarChart data={rows} margin={{ left: -8, right: 8, top: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
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
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="products"
            stackId="uploads"
            fill="var(--color-products)"
            radius={[0, 0, 2, 2]}
            maxBarSize={40}
          />
          <Bar
            dataKey="parts"
            stackId="uploads"
            fill="var(--color-parts)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ChartContainer>
      )}
    </div>
  );
}
