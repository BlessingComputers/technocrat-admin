"use client";

import { cn } from "@/lib/utils/cn";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardKpiGrid } from "./dashboard-kpi-grid";
import { DashboardRecentOrders } from "./dashboard-recent-orders";
import { DashboardDateFilter } from "./dashboard-date-filter";
import { UploaderAnalyticsSection } from "./uploader-analytics-section";
import { SuperAdminAnalyticsSection } from "./super-admin-analytics-section";
import { StaffSnapshotSection } from "./staff-snapshot-section";
import { QuickLinksGrid } from "./quick-links-grid";
import { useDashboardData } from "../hooks/use-dashboard-data";
import type { StaffDashboardData } from "../types/analytics";
import PageContainer from "@/components/layouts/page-container";

/** Dashboard view (route `/`, the home page). Thin orchestrator over `useDashboardData`. */
export function DashboardView() {
  const {
    profile,
    isSuperAdmin,
    isLoading,
    isFetching,
    dashboardData,
    recentOrders,
    period,
    appliedCustomDates,
    handlePeriodChange,
    handleApplyCustomRange,
    handleRefresh,
  } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;

  return (
    <PageContainer>
      <PageHeader
        title={isSuperAdmin ? "Super Admin Dashboard" : "Staff Dashboard"}
        description={`Welcome back, ${profile?.firstName || "Staff"}! Here's your overview for today.`}
      >
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <DashboardDateFilter
              period={period}
              appliedCustomDates={appliedCustomDates}
              onPeriodChange={handlePeriodChange}
              onApplyCustomRange={handleApplyCustomRange}
            />
          )}
          <RefreshButton
            onRefresh={handleRefresh}
            isRefreshing={isLoading || isFetching}
            className="h-9 font-medium text-xs gap-2"
          />
        </div>
      </PageHeader>
      <div
        className={cn(
          "transition-opacity duration-200",
          isFetching ? "opacity-60 pointer-events-none" : "opacity-100",
        )}
      >
        <DashboardKpiGrid
          isSuperAdmin={isSuperAdmin}
          dashboardData={dashboardData}
        />
      </div>
      {isSuperAdmin && <SuperAdminAnalyticsSection />}
      {isSuperAdmin && (
        <UploaderAnalyticsSection
          period={period}
          appliedCustomDates={appliedCustomDates}
        />
      )}
      {!isSuperAdmin && (
        <>
          <StaffSnapshotSection
            data={dashboardData as StaffDashboardData | undefined}
          />
          <QuickLinksGrid staffSession={profile} />
        </>
      )}
      <DashboardRecentOrders recentOrders={recentOrders} />
    </PageContainer>
  );
}
