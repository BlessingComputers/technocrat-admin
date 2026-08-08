"use client";

import { useMemo } from "react";
import { SnapshotDonutCard } from "./snapshot-donut-card";
import { useOrderAnalytics } from "../api/analytics.queries";
import {
  CHART_SERIES,
  humanizeLabel,
  toSeriesKey,
} from "../utils/format-chart";
import type { AnalyticsPeriod } from "../types/chart-analytics";

/** Order status distribution (donut) for the selected window; links to orders. */
export function OrdersBreakdownChart({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useOrderAnalytics({ period });

  const slices = useMemo(
    () =>
      (data?.statusBreakdown ?? []).map((s, i) => ({
        key: toSeriesKey(s.status),
        label: humanizeLabel(s.status),
        value: s.count,
        pct: s.pct,
        color: CHART_SERIES[i % CHART_SERIES.length],
      })),
    [data],
  );

  return (
    <SnapshotDonutCard
      title="Orders"
      subtitle="Status breakdown"
      icon="solar:cart-large-2-bold"
      iconClass="bg-gold/15 text-gold"
      href="/orders"
      linkLabel="Manage orders"
      centerValue={data?.totalOrders ?? 0}
      centerLabel="Orders"
      slices={slices}
      isLoading={isLoading}
      emptyIcon="solar:cart-large-2-linear"
    />
  );
}
