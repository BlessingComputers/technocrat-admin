import { KpiCard } from "./kpi-card";
import { buildDefaultKpis, buildStaffKpis } from "../utils/build-summary-kpis";
import type { DashboardData, StaffDashboardData } from "../types/analytics";

interface SummaryKpisGridProps {
  isSuperAdmin: boolean;
  dashboardData?: DashboardData | null;
}

/**
 * The fallback 4-up KPI grid used when the live super-admin payload isn't
 * available: staff get their own KPIs, everyone else the empty-state defaults.
 *
 * NOTE: the legacy super-admin *cached* path (flat `totalRevenue` payload) is
 * dropped — super admins always get the live nested KPI payload from the KPIs
 * endpoint, so that branch was unreachable. Re-add with codegen types if a
 * cached super-admin endpoint is wired.
 */
export function SummaryKpisGrid({
  isSuperAdmin,
  dashboardData,
}: SummaryKpisGridProps) {
  let kpis = buildDefaultKpis();

  if (!isSuperAdmin && dashboardData) {
    kpis = buildStaffKpis(dashboardData as StaffDashboardData);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <KpiCard key={i} {...kpi} />
      ))}
    </div>
  );
}
