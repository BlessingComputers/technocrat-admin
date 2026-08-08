import type { SuperAdminLiveKpiData } from "./dashboard-kpi";

/**
 * Types specific to the analytics feature (Dashboard + Analytics — ADR-0002).
 *
 * TODO(codegen, ADR-0006): alias generated response schemas; Zod owns inputs.
 */

/** Per-staff dashboard payload (non-super-admin). Only the read fields are typed. */
export interface StaffDashboardData {
  staffId: string;
  staffDisplayId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    systemRole: string;
    customRoleId: string;
    customRoleName: string;
  };
  permissions: string[];
  sections: {
    orders?: {
      totalOrders: number;
      todayOrders: number;
      pendingOrders: number;
      processingOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      pendingPriceConfirmation: number;
      recentOrders: DashboardOrder[];
    };
    payments?: {
      totalRevenue: number;
      todayRevenue: number;
      thisMonthRevenue: number;
      revenueGrowth: number;
      pendingPayments: number;
      failedPayments: number;
      totalRefunds: number;
      totalRefundAmount: number;
    };
    customers?: {
      totalCustomers: number;
      activeCustomers: number;
      newCustomersToday: number;
      newCustomersThisMonth: number;
      suspendedCustomers: number;
    };
    inventory?: {
      lowStockVariants: number;
      outOfStockVariants: number;
      totalVariants: number;
      activeVariants: number;
    };
    [key: string]: unknown;
  };
  generatedAt: string;
}

/**
 * Loose recent-order shape for the dashboard widget. Handles both the manual
 * order (nested `customer`) and staff-dashboard order (flat `customerName`)
 * variants. A richer `Order` type will live in the `orders` feature; this is
 * only what the dashboard table reads.
 */
export interface DashboardOrder {
  id: string;
  orderNumber?: string;
  orderStatus: string;
  paymentStatus?: string;
  totalAmount?: number;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  product?: string;
  manualOrderId?: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items?: Array<{ productName: string }>;
}

/** The dashboard data union flowing through the KPI components. */
export type DashboardData = SuperAdminLiveKpiData | StaffDashboardData;

/** Custom date range applied to the super-admin KPI period filter. */
export interface AppliedDateRange {
  from: string;
  to: string;
}

/** Query params for the super-admin KPI endpoint. */
export interface AdminKpiParams {
  period?: string;
  from?: string;
  to?: string;
  sections?: string;
  // Index signature keeps this assignable to the client's query-param type.
  [key: string]: string | undefined;
}
