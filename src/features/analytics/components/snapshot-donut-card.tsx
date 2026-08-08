"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AnalyticsChartCard } from "./analytics-chart-card";
import { ChartEmpty, ChartLoading } from "./chart-states";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** Optional pre-computed percentage; otherwise derived from the total. */
  pct?: number;
  /** CSS colour (e.g. a `var(--chart-N)` reference or a token). */
  color: string;
}

interface SnapshotDonutCardProps {
  title: string;
  subtitle?: string;
  icon: string;
  iconClass?: string;
  href?: string;
  linkLabel?: string;
  /** Big number shown in the donut hole. */
  centerValue: number;
  centerLabel: string;
  slices: DonutSlice[];
  isLoading?: boolean;
  emptyIcon?: string;
  emptyMessage?: string;
}

/**
 * Reusable donut + legend card driven entirely by props. Used for both the
 * super-admin order-status breakdown (fetched) and the staff snapshot charts
 * (fed from the staff dashboard payload) so the visual stays identical.
 */
export function SnapshotDonutCard({
  title,
  subtitle,
  icon,
  iconClass = "bg-primary/10 text-primary",
  href,
  linkLabel = "View all",
  centerValue,
  centerLabel,
  slices,
  isLoading = false,
  emptyIcon,
  emptyMessage,
}: SnapshotDonutCardProps) {
  const total = useMemo(
    () => slices.reduce((sum, s) => sum + s.value, 0),
    [slices],
  );

  const chartConfig = useMemo(
    () =>
      slices.reduce<ChartConfig>((acc, s) => {
        acc[s.key] = { label: s.label, color: s.color };
        return acc;
      }, {}),
    [slices],
  );

  const hasData = slices.length > 0 && total > 0;

  return (
    <AnalyticsChartCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconClass={iconClass}
      href={href}
      linkLabel={linkLabel}
    >
      {isLoading ? (
        <ChartLoading className="h-[220px]" />
      ) : !hasData ? (
        <ChartEmpty className="h-[220px]" icon={emptyIcon} message={emptyMessage} />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative shrink-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[160px]"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="label" hideLabel />}
                />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {slices.map((s) => (
                    <Cell key={s.key} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums leading-none">
                {centerValue.toLocaleString()}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {centerLabel}
              </span>
            </div>
          </div>

          <ul className="flex-1 space-y-1.5">
            {slices.map((s) => {
              const pct = s.pct ?? (total ? Math.round((s.value / total) * 100) : 0);
              return (
                <li
                  key={s.key}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate font-medium text-muted-foreground">
                      {s.label}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">
                    {s.value.toLocaleString()}
                    <span className="ml-1 font-medium text-muted-foreground">
                      {pct}%
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </AnalyticsChartCard>
  );
}
