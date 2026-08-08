"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MonitorStats } from "../../types/monitor";

const chartConfig = {
  count: { label: "Requests", color: "var(--chart-1)" },
  errors: { label: "Errors", color: "var(--destructive)" },
} satisfies ChartConfig;

/**
 * Last-60-minutes request volume, always the same window regardless of the
 * stats page's `hours` selector — `requestsPerMinute` is fixed server-side.
 */
export function RequestsPerMinuteChart({
  points,
}: {
  points: MonitorStats["requestsPerMinute"];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillMonitorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="minute"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={(v) => String(v).slice(-5)}
          className="text-xs"
        />
        <YAxis tickLine={false} axisLine={false} width={36} className="text-xs" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="count"
          type="monotone"
          stroke="var(--color-count)"
          strokeWidth={2}
          fill="url(#fillMonitorCount)"
        />
        <Area
          dataKey="errors"
          type="monotone"
          stroke="var(--color-errors)"
          strokeWidth={2}
          fill="none"
        />
      </AreaChart>
    </ChartContainer>
  );
}
