"use client";

import { SnapshotDonutCard, type DonutSlice } from "./snapshot-donut-card";
import type { StaffDashboardData } from "../types/analytics";

/**
 * Staff order-status donut, built from the snapshot counts in the staff
 * dashboard payload (no time-series for regular admins). Links to orders.
 */
export function StaffOrderStatusChart({
  orders,
}: {
  orders: NonNullable<StaffDashboardData["sections"]["orders"]>;
}) {
  const slices: DonutSlice[] = [
    {
      key: "completed",
      label: "Completed",
      value: orders.completedOrders ?? 0,
      color: "var(--success)",
    },
    {
      key: "processing",
      label: "Processing",
      value: orders.processingOrders ?? 0,
      color: "var(--info)",
    },
    {
      key: "pending",
      label: "Pending",
      value: orders.pendingOrders ?? 0,
      color: "var(--gold)",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      value: orders.cancelledOrders ?? 0,
      color: "var(--destructive)",
    },
  ].filter((s) => s.value > 0);

  return (
    <SnapshotDonutCard
      title="Orders"
      subtitle={`${(orders.todayOrders ?? 0).toLocaleString()} today`}
      icon="solar:cart-large-2-bold"
      iconClass="bg-gold/15 text-gold"
      href="/orders"
      linkLabel="Manage orders"
      centerValue={orders.totalOrders ?? 0}
      centerLabel="Orders"
      slices={slices}
      emptyIcon="solar:cart-large-2-linear"
      emptyMessage="No orders yet"
    />
  );
}
