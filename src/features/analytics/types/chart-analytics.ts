/**
 * Response shapes for the SUPER_ADMIN time-series analytics endpoints
 * (`/v1/admin/analytics/{revenue,orders,products,customers}`) that back the
 * dashboard charts. Typed to exactly what the charts read; the backend owns the
 * canonical shape (ADR-0006 will alias generated schemas once codegen lands).
 */

/** Accepted analytics windows shared by revenue/orders/customers. */
export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m";

/** Query params for the period-bounded analytics endpoints. */
export interface AnalyticsPeriodParams {
  period?: AnalyticsPeriod;
  // Index signature keeps this assignable to the client's query-param type.
  [key: string]: string | undefined;
}

// ── Revenue ──────────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}

export interface RevenueAnalytics {
  period: AnalyticsPeriod;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  dataPoints: RevenueDataPoint[];
}

// ── Orders ───────────────────────────────────────────────────────────────────

export interface OrderStatusSlice {
  status: string;
  count: number;
  pct: number;
}

export interface OrderVolumePoint {
  date: string;
  count: number;
}

export interface OrderAnalytics {
  period: AnalyticsPeriod;
  totalOrders: number;
  statusBreakdown: OrderStatusSlice[];
  dataPoints: OrderVolumePoint[];
}

// ── Products ─────────────────────────────────────────────────────────────────

export interface TopSellingProduct {
  productId: string;
  productName: string;
  totalSales: number;
  totalRevenue: number;
}

export interface ProductAnalytics {
  topSellingProducts: TopSellingProduct[];
  lowStockVariants: number;
  outOfStockVariants: number;
  discontinuedVariants: number;
  totalVariants: number;
}

// ── Customers ────────────────────────────────────────────────────────────────

export interface LoyaltySlice {
  tier: string;
  count: number;
  pct: number;
}

export interface TopSpender {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyTier: string;
}

export interface CustomerNewPoint {
  date: string;
  count: number;
}

export interface CustomerAnalytics {
  period: AnalyticsPeriod;
  newCustomers: number;
  totalCustomers: number;
  loyaltyBreakdown: LoyaltySlice[];
  topSpenders: TopSpender[];
  dataPoints: CustomerNewPoint[];
}
