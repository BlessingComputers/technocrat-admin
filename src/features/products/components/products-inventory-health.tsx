"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { ProductStats } from "../types/products";
import { MetaLabel } from "@/components/shared/meta-label";

const chartConfig = {
  healthy: { label: "Healthy", color: "var(--success)" },
  low: { label: "Low stock", color: "var(--warning)" },
  out: { label: "Out of stock", color: "var(--destructive)" },
} satisfies ChartConfig;

type SegmentKey = keyof typeof chartConfig;

/**
 * Turns the flat product stats into an at-a-glance stock-composition donut:
 * healthy vs low-stock vs out-of-stock. Pure client — derives everything from
 * the `stats` the hub already fetches, so it needs no extra endpoint.
 */
export function ProductsInventoryHealth({ stats }: { stats: ProductStats }) {
  const healthy = Math.max(0, stats.total - stats.lowStock - stats.outOfStock);
  const segments = (
    [
      { key: "healthy", value: healthy },
      { key: "low", value: stats.lowStock },
      { key: "out", value: stats.outOfStock },
    ] satisfies { key: SegmentKey; value: number }[]
  ).filter((s) => s.value > 0);

  const healthyPct = stats.total > 0 ? Math.round((healthy / stats.total) * 100) : 0;

  return (
    <Card className="flex h-full flex-col gap-5 p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success-ink">
          <AppIcon icon="solar:chart-2-bold" className="size-5" />
        </span>
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">
            Inventory Health
          </h3>
          <p className="text-xs text-muted-foreground">
            Stock composition of the catalog
          </p>
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
          <AppIcon icon="solar:box-linear" className="size-8 opacity-30" />
          <p className="text-xs font-medium">No products yet</p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[180px]"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="key" hideLabel />}
                />
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="key"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={2}
                  strokeWidth={2}
                >
                  {segments.map((s) => (
                    <Cell key={s.key} fill={`var(--color-${s.key})`} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {healthyPct}%
              </span>
              <MetaLabel>
                Healthy
              </MetaLabel>
            </div>
          </div>

          <div className="space-y-2">
            {(Object.keys(chartConfig) as SegmentKey[]).map((key) => {
              const value =
                key === "healthy"
                  ? healthy
                  : key === "low"
                    ? stats.lowStock
                    : stats.outOfStock;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: chartConfig[key].color }}
                    />
                    {chartConfig[key].label}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
