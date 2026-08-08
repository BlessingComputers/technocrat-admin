import { SuperAdminLiveKpis } from "./super-admin-live-kpis";
import { SummaryKpisGrid } from "./summary-kpis-grid";
import type { SuperAdminLiveKpiData } from "../types/dashboard-kpi";
import type { DashboardData } from "../types/analytics";

interface DashboardKpiGridProps {
  isSuperAdmin: boolean;
  dashboardData?: DashboardData | null;
}

/**
 * Top-level KPI router. Super admins with the live, uncached payload (nested
 * `revenue` present) get the detailed live cards + ops snapshot; everyone else
 * gets the summary grid.
 */
export function DashboardKpiGrid({
  isSuperAdmin,
  dashboardData,
}: DashboardKpiGridProps) {
  const hasLiveSuperAdminPayload =
    isSuperAdmin &&
    !!dashboardData &&
    "revenue" in dashboardData &&
    !!dashboardData.revenue;

  if (hasLiveSuperAdminPayload) {
    const data = dashboardData as SuperAdminLiveKpiData;
    return <SuperAdminLiveKpis data={data} />;
  }

  return (
    <SummaryKpisGrid isSuperAdmin={isSuperAdmin} dashboardData={dashboardData} />
  );
}
