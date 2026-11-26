import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { priceCheckedBefore } from "@/lib/utils/price-age";
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
  UploaderUpdatesParams,
  UploaderUpdatesResponse,
  CatalogProduct,
  CatalogPart,
  UploadTarget,
  PriceAgeCounts,
} from "../types/upload-analytics";
import type {
  AnalyticsPeriodParams,
  CustomerAnalytics,
  OrderAnalytics,
  ProductAnalytics,
  RevenueAnalytics,
} from "../types/chart-analytics";
import type { AdSpend, AdSpendBody, DateWindow } from "../types/ad-spend";

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
/** A list response read only for its total. */
interface TotalOnly {
  meta?: { total?: number };
}

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

  /** Entries overlapping [from, to], newest first. Unpaginated (tens a month). */
  listAdSpend: (range: DateWindow) =>
    api.get<AdSpend[]>(API_ENDPOINTS.analytics.adSpend, { params: { ...range } }),

  /** Needs `analytics:write`. */
  createAdSpend: (body: AdSpendBody) => api.post<AdSpend>(API_ENDPOINTS.analytics.adSpend, body),

  /** Send only what changed. Needs `analytics:write`. */
  updateAdSpend: (id: string, body: Partial<AdSpendBody>) =>
    api.patch<AdSpend>(API_ENDPOINTS.analytics.adSpendEntry(id), body),

  /** 204, no body. Needs `analytics:write`. */
  deleteAdSpend: (id: string) => api.delete<void>(API_ENDPOINTS.analytics.adSpendEntry(id)),

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

  /** One product's full record for the uploader item sheet (DB UUID). */
  getCatalogProduct: (id: string) =>
    api.get<CatalogProduct>(`${API_ENDPOINTS.products.base}/${id}`),

  /** One part's full record for the uploader item sheet (DB UUID). */
  getCatalogPart: (id: string) =>
    api.get<CatalogPart>(API_ENDPOINTS.products.parts.detail(id)),

  /** Items one uploader was credited for updating (the rows behind `updates`). */
  getUploaderUpdates: ({ staffId, startDate, endDate, page }: UploaderUpdatesParams) =>
    api.get<UploaderUpdatesResponse>(API_ENDPOINTS.analytics.uploaderUpdates(staffId), {
      params: { startDate, endDate, page },
    }),

  /**
   * Stale-price counts for the dashboard card. Requires `products:read`.
   *
   * Counted through the two lists, not `GET /analytics/price-age`: that
   * endpoint has no `fxLinked` param, and linked items must be left out (FX
   * moves their price without moving `priceCheckedAt`). The lists match its
   * rule: active only, and `/products/all` drops hidden backing products.
   * A backend without ask 45 ignores `fxLinked`, which counts what it did.
   */
  getPriceAge: async (days: number): Promise<PriceAgeCounts> => {
    const shared = {
      page: 1,
      limit: 1,
      priceCheckedBefore: priceCheckedBefore(days),
      fxLinked: "false",
    };
    const [products, parts] = await Promise.all([
      // `/products/all` keeps `meta` beside `data`, so it needs `raw`.
      api.get<TotalOnly>(API_ENDPOINTS.products.list, { params: shared, raw: true }),
      api.get<TotalOnly>(API_ENDPOINTS.products.parts.list, {
        params: { ...shared, isActive: "true" },
      }),
    ]);
    return { products: products.meta?.total ?? 0, parts: parts.meta?.total ?? 0 };
  },
};
