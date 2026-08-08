import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/error";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Customer,
  CustomerAnalytics,
  CustomerAnalyticsPeriod,
  CustomerDetail,
  CustomerInvoiceSummary,
  CustomerListMeta,
  CustomerOrderSummary,
  CustomersListParams,
  CustomersResult,
} from "../types/customers";

const DEFAULT_LIMIT = 20;
/** How many of a customer's most-recent orders to pull for the detail page. */
const ORDER_HISTORY_LIMIT = 100;

/**
 * Normalize whatever list envelope the backend returns into `{ data, meta }`.
 *
 * The customer list response body is undocumented in the OpenAPI spec (ADR-0006),
 * so we defend against the three plausible shapes (the exact "sibling meta drops
 * on unwrap" risk flagged in ADR-0007):
 *   1. `{ success, data: Customer[], meta }`          — sibling pagination
 *   2. `{ success, data: { customers, pagination } }` — nested payload
 *   3. `Customer[]`                                    — bare array (no meta)
 */
function normalizeList(
  raw: unknown,
  params: CustomersListParams,
): CustomersResult {
  const requestedPage = params.page ?? 1;
  const requestedLimit = params.limit ?? DEFAULT_LIMIT;

  const root = (raw ?? {}) as Record<string, unknown>;
  const payload = "data" in root ? root.data : root;

  let data: Customer[] = [];
  let rawMeta: Record<string, unknown> = {};

  if (Array.isArray(payload)) {
    data = payload as Customer[];
    rawMeta = (root.meta as Record<string, unknown>) ?? {};
  } else if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const list = (obj.customers ?? obj.items ?? obj.results ?? obj.data) as
      | Customer[]
      | undefined;
    data = Array.isArray(list) ? list : [];
    rawMeta =
      (obj.pagination as Record<string, unknown>) ??
      (obj.meta as Record<string, unknown>) ??
      (root.meta as Record<string, unknown>) ??
      {};
  }

  const num = (v: unknown, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  const total = num(rawMeta.total ?? rawMeta.totalItems ?? rawMeta.count, data.length);
  const limit = num(rawMeta.limit ?? rawMeta.pageSize, requestedLimit);
  const page = num(rawMeta.page ?? rawMeta.currentPage, requestedPage);
  const totalPages = num(
    rawMeta.totalPages ?? rawMeta.pages ?? rawMeta.pageCount,
    Math.max(1, Math.ceil(total / Math.max(1, limit))),
  );

  const meta: CustomerListMeta = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage:
      typeof rawMeta.hasNextPage === "boolean"
        ? rawMeta.hasNextPage
        : typeof rawMeta.hasNext === "boolean"
          ? (rawMeta.hasNext as boolean)
          : page < totalPages,
    hasPrevPage:
      typeof rawMeta.hasPrevPage === "boolean"
        ? rawMeta.hasPrevPage
        : typeof rawMeta.hasPrev === "boolean"
          ? (rawMeta.hasPrev as boolean)
          : page > 1,
  };

  return { data, meta };
}

/** Drop empty/undefined params so backend enum validation doesn't choke. */
function cleanParams(
  params: CustomersListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== undefined && value !== null) {
      out[key] = value as string | number;
    }
  }
  return out;
}

/**
 * The admin manual-orders endpoint is exposed under two URL shapes; mirror the
 * orders service's behaviour — try the primary, retry the fallback on a 404.
 * `{ raw: true }` keeps the `{ data, meta }` envelope so we can read the list.
 */
async function fetchOrdersRaw(
  params: Record<string, string | number>,
): Promise<unknown> {
  try {
    return await api.get<unknown>(API_ENDPOINTS.adminCheckout.orders.base, {
      params,
      raw: true,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return api.get<unknown>(API_ENDPOINTS.adminCheckout.orders.fallback, {
        params,
        raw: true,
      });
    }
    throw error;
  }
}

/** Keep only rows that actually belong to this customer (search is fuzzy). */
function belongsToCustomer(
  order: CustomerOrderSummary,
  customer: { id?: string; customerId?: string; email?: string },
): boolean {
  const c = order.customer;
  if (!c) return true;
  if (c.customerId && customer.customerId) {
    return c.customerId === customer.customerId;
  }
  if (c.id && customer.id) return c.id === customer.id;
  if (c.email && customer.email) {
    return c.email.toLowerCase() === customer.email.toLowerCase();
  }
  return true;
}

export const customerService = {
  getAllCustomers: async (
    params: CustomersListParams,
  ): Promise<CustomersResult> => {
    // `{ raw: true }` keeps the full envelope so `normalizeList` can recover the
    // pagination meta the standard unwrap would otherwise drop (ADR-0007).
    const raw = await api.get<unknown>(API_ENDPOINTS.customerMgt.base, {
      params: cleanParams(params),
      raw: true,
    });
    return normalizeList(raw, params);
  },

  getCustomer: (id: string): Promise<CustomerDetail> =>
    api.get<CustomerDetail>(API_ENDPOINTS.customerMgt.detail(id)),

  /**
   * A customer's order history. The customer-detail endpoint doesn't reliably
   * return orders, so we recover them from the admin manual-orders list by
   * searching on the customer's email (the endpoint's `search` matches email),
   * then tighten the fuzzy match client-side. Each row links to `/orders/:id`.
   */
  getCustomerOrders: async (customer: {
    id?: string;
    customerId?: string;
    email?: string;
  }): Promise<CustomerOrderSummary[]> => {
    if (!customer.email) return [];
    const raw = await fetchOrdersRaw({
      search: customer.email,
      sortBy: "newest",
      limit: ORDER_HISTORY_LIMIT,
    });
    const root = (raw ?? {}) as Record<string, unknown>;
    const list = Array.isArray(root.data)
      ? (root.data as CustomerOrderSummary[])
      : [];
    return list.filter((order) => belongsToCustomer(order, customer));
  },

  /**
   * A customer's invoice history (GET /v1/invoice/customer/:id). The path param
   * is the customer's UUID (`customer.id`). Returns the inner list defensively —
   * the response is undocumented, so accept the `{ data }` envelope, a nested
   * `{ invoices }`, or a bare array. Each row links to `/invoices/:invoiceId`.
   */
  getCustomerInvoices: async (
    customerId: string,
  ): Promise<CustomerInvoiceSummary[]> => {
    if (!customerId) return [];
    const raw = await api.get<unknown>(
      API_ENDPOINTS.invoice.byCustomer(customerId),
      { params: { page: 1, limit: ORDER_HISTORY_LIMIT }, raw: true },
    );
    const root = (raw ?? {}) as Record<string, unknown>;
    const payload = "data" in root ? root.data : root;
    if (Array.isArray(payload)) return payload as CustomerInvoiceSummary[];
    const nested = (payload as Record<string, unknown>)?.invoices;
    return Array.isArray(nested) ? (nested as CustomerInvoiceSummary[]) : [];
  },

  getAnalytics: (period: CustomerAnalyticsPeriod): Promise<CustomerAnalytics> =>
    api.get<CustomerAnalytics>(API_ENDPOINTS.customerMgt.analytics, {
      params: { period },
    }),
};
