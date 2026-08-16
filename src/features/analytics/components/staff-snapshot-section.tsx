"use client";

import { StaffOrderStatusChart } from "./staff-order-status-chart";
import { StaffInventoryHealthChart } from "./staff-inventory-health-chart";
import type { StaffDashboardData } from "../types/analytics";

/**
 * Regular-admin snapshot charts: order-status and inventory-health donuts built
 * from the staff dashboard payload. Each chart only renders when its section is
 * present (sections are permission-gated by the backend), so a staff member
 * with, say, only orders access sees just the orders donut.
 */
export function StaffSnapshotSection({
  data,
}: {
  data?: StaffDashboardData | null;
}) {
  const orders = data?.sections?.orders;
  const inventory = data?.sections?.inventory;

  if (!orders && !inventory) return null;

  return (
    <section className="space-y-4 border-t border-border/70 pt-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span className="h-2 w-2 rounded-full bg-primary" />
        Your Snapshot
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {orders && <StaffOrderStatusChart orders={orders} />}
        {inventory && <StaffInventoryHealthChart inventory={inventory} />}
      </div>
    </section>
  );
}
