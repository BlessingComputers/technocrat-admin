"use client";

import { useState } from "react";
import { useStaffSession } from "@/lib/auth/session-context";
import { isSuperAdmin } from "@/lib/auth/permissions";
import {
  useAdminDashboardKpis,
  useStaffDashboard,
  useRecentOrders,
} from "../api/analytics.queries";
import type {
  AdminKpiParams,
  AppliedDateRange,
  DashboardData,
} from "../types/analytics";

/**
 * Bundles every piece of state and every query the dashboard needs: session +
 * role, date filter, KPI fetches (live super-admin or per-staff), recent orders.
 * Returns a flat object so the view stays a thin orchestrator.
 */
export function useDashboardData() {
  const { staffSession: profile } = useStaffSession();
  const superAdmin = isSuperAdmin(profile);

  const [period, setPeriod] = useState<string>("30d");
  const [appliedCustomDates, setAppliedCustomDates] =
    useState<AppliedDateRange | null>(null);

  const kpiParams: AdminKpiParams = {
    period,
    from: period === "custom" ? appliedCustomDates?.from : undefined,
    to: period === "custom" ? appliedCustomDates?.to : undefined,
  };

  const {
    data: adminKpis,
    isLoading: adminKpisLoading,
    isFetching: adminKpisFetching,
    refetch: refetchAdminKpis,
  } = useAdminDashboardKpis(superAdmin ? kpiParams : undefined);

  const {
    data: staffData,
    isLoading: staffLoading,
    refetch: refetchStaff,
  } = useStaffDashboard();

  const {
    data: recentOrders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useRecentOrders(5);

  const isLoading = (superAdmin ? adminKpisLoading : staffLoading) || ordersLoading;

  const dashboardData: DashboardData | undefined = superAdmin
    ? adminKpis
    : staffData;

  const handleRefresh = () => {
    refetchOrders();
    if (superAdmin) {
      refetchAdminKpis();
    } else {
      refetchStaff();
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== "custom") {
      setAppliedCustomDates(null);
    }
  };

  return {
    profile,
    isSuperAdmin: superAdmin,
    isLoading,
    isFetching: adminKpisFetching,
    dashboardData,
    recentOrders,
    period,
    appliedCustomDates,
    handlePeriodChange,
    handleApplyCustomRange: setAppliedCustomDates,
    handleRefresh,
  };
}
