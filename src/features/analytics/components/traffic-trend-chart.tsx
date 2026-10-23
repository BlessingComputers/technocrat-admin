"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmpty } from "./chart-states";
import { compactNumber, formatChartDate } from "../utils/format-chart";
import type { TrafficReport } from "../types/traffic";

const chartConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
} satisfies ChartConfig;

function formatBucket(date: string, bucket: TrafficReport["trendBucket"]) {
  if (bucket === "month") {
    const d = new Date(`${date}T00:00:00`);
    return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return formatChartDate(date);
}

/**
 * Visitors over the period as one area series. Page views ride in the tooltip
 * rather than as a second line: they run 2 to 4 times higher, and two scales
 * on one chart would make either line hard to read.
 */
export function TrafficTrendChart({
  points,
  bucket,
}: {
  points: TrafficReport["trend"];
  bucket: TrafficReport["trendBucket"];
}) {
  if (points.every((p) => p.visitors === 0)) return <ChartEmpty className="h-[240px]" />;

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={(v) => formatBucket(String(v), bucket)}
          className="text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
          tickFormatter={(v) => compactNumber(Number(v))}
          className="text-xs"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const date = String(payload?.[0]?.payload?.date ?? "");
                return bucket === "week" ? `Week of ${formatChartDate(date)}` : formatBucket(date, bucket);
              }}
              formatter={(value, name, item) => (
                <div className="flex w-full flex-col gap-0.5">
                  <span className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Visitors</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {Number(value).toLocaleString()}
                    </span>
                  </span>
                  <span className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Page views</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {Number(item.payload.pageviews).toLocaleString()}
                    </span>
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="visitors"
          type="monotone"
          stroke="var(--color-visitors)"
          strokeWidth={2}
          fill="url(#fillVisitors)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
