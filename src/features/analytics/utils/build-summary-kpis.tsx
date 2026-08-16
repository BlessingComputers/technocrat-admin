import type { StatTone } from "@/components/shared/stats-bar";
import { formatPrice } from "@/lib/utils/format";
import type { StaffDashboardData } from "../types/analytics";

export interface SummaryKpi {
  title: string;
  value: string;
  trend: string;
  trendType: "up" | "down";
  description: string;
  /** Iconify name, resolved by <Stat>. */
  icon: string;
  tone: StatTone;
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
      icon: "solar:chart-2-linear",
      tone: "primary",
    },
    {
      title: "Total Orders",
      value: "0",
      trend: "0%",
      trendType: "up",
      description: "All time",
      icon: "solar:cart-large-2-linear",
      tone: "warning",
    },
    {
      title: "Total Products",
      value: "0",
      trend: "0%",
      trendType: "up",
      description: "Active",
      icon: "solar:box-linear",
      tone: "success",
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
      icon: "solar:chart-2-linear",
      tone: "primary",
    },
    {
      title: "Handled Orders",
      value: (orders?.totalOrders || 0).toLocaleString(),
      trend: "Active",
      trendType: "up",
      description: `${orders?.pendingOrders || 0} pending`,
      icon: "solar:cart-large-2-linear",
      tone: "warning",
    },
    {
      title: "Low Stock Alerts",
      value: (inventory?.lowStockVariants || 0).toLocaleString(),
      trend: "Critical",
      trendType: "down",
      description: `${inventory?.outOfStockVariants || 0} out of stock`,
      icon: "solar:box-linear",
      tone: "success",
    },
    {
      title: "Active Customers",
      value: (customers?.activeCustomers || 0).toLocaleString(),
      trend: "Total",
      trendType: "up",
      description: `${customers?.totalCustomers || 0} in database`,
      icon: "solar:users-group-rounded-linear",
      tone: "info",
    },
  ];
}
