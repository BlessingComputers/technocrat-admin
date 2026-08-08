import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import type { StaffDashboardData } from "../types/analytics";

export interface SummaryKpi {
  title: string;
  value: string;
  trend: string;
  trendType: "up" | "down";
  description: string;
  icon: ReactNode;
  color: "primary" | "emerald" | "amber" | "blue";
}

/** Default empty-state KPIs shown when there's no dashboard data yet. */
export function buildDefaultKpis(): SummaryKpi[] {
  return [
    {
      title: "Total Revenue",
      value: "₦0",
      trend: "0%",
      trendType: "up",
      description: "All time",
      icon: <AppIcon icon="solar:chart-2-bold" className="size-4" />,
      color: "primary",
    },
    {
      title: "Total Orders",
      value: "0",
      trend: "0%",
      trendType: "up",
      description: "All time",
      icon: <AppIcon icon="solar:cart-large-2-bold" className="size-4" />,
      color: "amber",
    },
    {
      title: "Total Products",
      value: "0",
      trend: "0%",
      trendType: "up",
      description: "Active",
      icon: <AppIcon icon="solar:box-bold" className="size-4" />,
      color: "emerald",
    },
  ];
}

/** KPIs shown to non-super-admin staff from the standard staff dashboard payload. */
export function buildStaffKpis(data: StaffDashboardData): SummaryKpi[] {
  const orders = data.sections?.orders;
  const payments = data.sections?.payments;
  const inventory = data.sections?.inventory;
  const customers = data.sections?.customers;

  return [
    {
      title: "Personal Revenue",
      value: formatPrice(payments?.totalRevenue || 0),
      trend: `+${payments?.revenueGrowth || 0}%`,
      trendType: (payments?.revenueGrowth || 0) >= 0 ? "up" : "down",
      description: "Your sales",
      icon: <AppIcon icon="solar:chart-2-bold" className="size-4" />,
      color: "primary",
    },
    {
      title: "Handled Orders",
      value: (orders?.totalOrders || 0).toLocaleString(),
      trend: "Active",
      trendType: "up",
      description: `${orders?.pendingOrders || 0} pending`,
      icon: <AppIcon icon="solar:cart-large-2-bold" className="size-4" />,
      color: "amber",
    },
    {
      title: "Low Stock Alerts",
      value: (inventory?.lowStockVariants || 0).toLocaleString(),
      trend: "Critical",
      trendType: "down",
      description: `${inventory?.outOfStockVariants || 0} out of stock`,
      icon: <AppIcon icon="solar:box-bold" className="size-4" />,
      color: "emerald",
    },
    {
      title: "Active Customers",
      value: (customers?.activeCustomers || 0).toLocaleString(),
      trend: "Total",
      trendType: "up",
      description: `${customers?.totalCustomers || 0} in database`,
      icon: <AppIcon icon="solar:users-group-rounded-bold" className="size-4" />,
      color: "blue",
    },
  ];
}
