import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { SuperAdminLiveKpiData } from "../types/dashboard-kpi";
import type {
  AdminKpiParams,
  DashboardOrder,
  StaffDashboardData,
} from "../types/analytics";
import type {
  UploadAnalyticsData,
  UploaderAnalyticsParams,
  UploaderItemsParams,
  UploaderPartsResponse,
  UploaderProductsResponse,
  UploadTarget,
} from "../types/upload-analytics";
import type {
  AnalyticsPeriodParams,
  CustomerAnalytics,
  OrderAnalytics,
  ProductAnalytics,
  RevenueAnalytics,
} from "../types/chart-analytics";

/** Build the shared item-list query: uploader + inclusive day-bounded window. */
function uploaderItemsQuery(params: UploaderItemsParams) {
  return {
    createdByStaffId: params.staffId,
    createdFrom: `${params.startDate}T00:00:00.000Z`,
    createdTo: `${params.endDate}T23:59:59.999Z`,
    sortBy: params.sortBy ?? "newest",
    page: params.page ?? 1,
    limit: 20,
  };
}

/**
 * Analytics data access (Dashboard + Analytics — ADR-0002, the `admin`
 * dashboard resource). The client unwraps the response envelope (ADR-0007), so
 * these return the inner payload directly.
 */
export const analyticsService = {
  /** Super-admin live KPI payload (nested revenue/orders/refunds buckets). */
  getAdminDashboardKpis: (params?: AdminKpiParams) =>
    api.get<SuperAdminLiveKpiData>(API_ENDPOINTS.admin.dashboardKpis, {
      params,
    }),

  /** Per-staff dashboard payload (sections.orders/payments/inventory/…). */
  getStaffDashboard: (staffId: string) =>
    api.get<StaffDashboardData>(API_ENDPOINTS.admin.staffDashboard(staffId)),

  /**
   * Recent orders for the dashboard widget. Reads the orders resource directly
   * (a read-only cross-resource aggregate) so the analytics feature stays
   * self-contained and never imports the `orders` feature.
   */
  getRecentOrders: (limit = 5) =>
    api.get<DashboardOrder[]>(API_ENDPOINTS.adminCheckout.orders.base, {
      params: { limit },
    }),

  /** Daily revenue + order trend over the window (SUPER_ADMIN). */
  getRevenueAnalytics: (params?: AnalyticsPeriodParams) =>
    api.get<RevenueAnalytics>(API_ENDPOINTS.admin.analytics.revenue, {
      params,
    }),

  /** Order volume trend + status breakdown over the window (SUPER_ADMIN). */
  getOrderAnalytics: (params?: AnalyticsPeriodParams) =>
    api.get<OrderAnalytics>(API_ENDPOINTS.admin.analytics.orders, { params }),

  /** Top sellers + stock-health summary (SUPER_ADMIN; no period). */
  getProductAnalytics: () =>
    api.get<ProductAnalytics>(API_ENDPOINTS.admin.analytics.products),

  /** New-signup trend + loyalty tiers + top spenders (SUPER_ADMIN). */
  getCustomerAnalytics: (params?: AnalyticsPeriodParams) =>
    api.get<CustomerAnalytics>(API_ENDPOINTS.admin.analytics.customers, {
      params,
    }),

  /** Per-uploader product/part counts vs daily target over a date range. */
  getUploaderAnalytics: (params: UploaderAnalyticsParams) =>
    api.get<UploadAnalyticsData>(API_ENDPOINTS.analytics.uploaders, { params }),

  /** Upsert a staff member's individual daily upload target (SUPER_ADMIN). */
  setUploadTarget: (
    staffId: string,
    body: { dailyTarget: number; note?: string },
  ) => api.put<UploadTarget>(API_ENDPOINTS.analytics.target(staffId), body),

  /** Remove a staff member's custom target — reverts to the global default. */
  deleteUploadTarget: (staffId: string) =>
    api.delete<{ message?: string }>(API_ENDPOINTS.analytics.target(staffId)),

  /**
   * One uploader's products in a date window. Reads the products list directly
   * (a read-only cross-resource query) so analytics stays self-contained and
   * never imports the `products` feature. `raw` keeps the sibling `meta`.
   */
  getUploaderProducts: (params: UploaderItemsParams) =>
    api.get<UploaderProductsResponse>(API_ENDPOINTS.products.list, {
      params: uploaderItemsQuery(params),
      raw: true,
    }),

  /** One uploader's parts in a date window (envelope unwraps to `{ data, meta }`). */
  getUploaderParts: (params: UploaderItemsParams) =>
    api.get<UploaderPartsResponse>(API_ENDPOINTS.products.parts.list, {
      params: uploaderItemsQuery(params),
    }),
};
