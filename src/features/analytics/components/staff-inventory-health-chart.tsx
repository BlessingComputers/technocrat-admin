"use client";

import { SnapshotDonutCard, type DonutSlice } from "./snapshot-donut-card";
import type { StaffDashboardData } from "../types/analytics";

/**
 * Staff inventory-health donut from the dashboard snapshot: in-stock vs low vs
 * out-of-stock variants. "In stock" is the remainder of total after the low /
 * out-of-stock buckets (clamped at zero). Links to inventories.
 */
export function StaffInventoryHealthChart({
  inventory,
}: {
  inventory: NonNullable<StaffDashboardData["sections"]["inventory"]>;
}) {
  const total = inventory.totalVariants ?? 0;
  const low = inventory.lowStockVariants ?? 0;
  const out = inventory.outOfStockVariants ?? 0;
  const inStock = Math.max(total - low - out, 0);

  const slices: DonutSlice[] = [
    { key: "in_stock", label: "In stock", value: inStock, color: "var(--success)" },
    { key: "low", label: "Low stock", value: low, color: "var(--jewel)" },
    { key: "out", label: "Out of stock", value: out, color: "var(--destructive)" },
  ].filter((s) => s.value > 0);

  return (
    <SnapshotDonutCard
      title="Inventory"
      subtitle={`${(inventory.activeVariants ?? 0).toLocaleString()} active variants`}
      icon="solar:box-minimalistic-bold"
      iconClass="bg-success/15 text-success"
      href="/inventories"
      linkLabel="Manage inventory"
      centerValue={total}
      centerLabel="Variants"
      slices={slices}
      emptyIcon="solar:box-minimalistic-linear"
      emptyMessage="No inventory data"
    />
  );
}
