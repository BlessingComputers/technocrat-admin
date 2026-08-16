"use client";

import { useState } from "react";
import { AnalyticsPeriodSelect } from "./analytics-period-select";
import { RevenueTrendChart } from "./revenue-trend-chart";
import { OrdersBreakdownChart } from "./orders-breakdown-chart";
import { TopProductsChart } from "./top-products-chart";
import { CustomersChart } from "./customers-chart";
import type { AnalyticsPeriod } from "../types/chart-analytics";

/**
 * Super-admin business-analytics section: a period-scoped grid of chart cards
 * (revenue, orders, top products, customers), each deep-linking to its resource
 * page. Owns the shared period window for the three time-series charts.
 */
export function SuperAdminAnalyticsSection() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  return (
    <section className="space-y-4 border-t border-border/70 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Business Analytics
        </h2>
        <AnalyticsPeriodSelect value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueTrendChart period={period} />
        </div>
        <div className="lg:col-span-1">
          <OrdersBreakdownChart period={period} />
        </div>
        <div className="lg:col-span-1">
          <TopProductsChart />
        </div>
        <div className="lg:col-span-2">
          <CustomersChart period={period} />
        </div>
      </div>
    </section>
  );
}
