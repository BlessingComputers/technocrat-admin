import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/error";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdminBankAccount,
  AdminOrderListParams,
  AllOrdersEnvelope,
  CheckoutStats,
  GatewayOrder,
  GatewayOrderListResponse,
  GatewayStatusHistoryEntry,
  ManualOrder,
  OrdersEnvelope,
} from "../types/orders";

/** UI source filter → the combined endpoint's `source` enum. */
const SOURCE_TO_BACKEND: Record<string, "ALL" | "ONLINE" | "MANUAL"> = {
  all: "ALL",
  gateway: "ONLINE",
  manual: "MANUAL",
};

/** Query params accepted by the main order module's staff list. */
export interface GatewayOrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  orderStatus?: string;
  paymentStatus?: string;
  orderType?: string;
  customerId?: string;
  from?: string;
  to?: string;
}

/**
 * Orders + Bank Accounts data access (the `adminCheckout` resource — ADR-0002).
 *
 * The backend exposes two URL shapes for these endpoints; `callWithFallback`
 * tries the primary and retries the fallback on a 404. The client unwraps the
 * response envelope (ADR-0007), so methods return the inner payload — except
 * `getOrders`, which uses `{ raw: true }` to keep the sibling pagination `meta`.
 */

interface CallConfig {
  params?: Record<string, string | number | boolean | undefined>;
  raw?: boolean;
}

async function callWithFallback<T>(
  method: "get" | "post" | "patch" | "delete",
  primaryUrl: string,
  fallbackUrl: string,
  data?: unknown,
  config?: CallConfig,
): Promise<T> {
  const execute = (url: string): Promise<T> => {
    switch (method) {
      case "get":
        return api.get<T>(url, config);
      case "delete":
        return api.delete<T>(url, config);
      case "post":
        return api.post<T>(url, data, config);
      case "patch":
        return api.patch<T>(url, data, config);
    }
  };

  try {
    return await execute(primaryUrl);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return execute(fallbackUrl);
    }
    throw error;
  }
}

export const ordersService = {
  // ── Bank Accounts ──────────────────────────────────────────────
  getBankAccounts: () =>
    callWithFallback<AdminBankAccount[]>(
      "get",
      API_ENDPOINTS.adminCheckout.bankAccounts.base,
      API_ENDPOINTS.adminCheckout.bankAccounts.fallback,
    ),

  createBankAccount: (data: Partial<AdminBankAccount>) =>
    callWithFallback<AdminBankAccount>(
      "post",
      API_ENDPOINTS.adminCheckout.bankAccounts.base,
      API_ENDPOINTS.adminCheckout.bankAccounts.fallback,
      data,
    ),

  updateBankAccount: (id: string, data: Partial<AdminBankAccount>) =>
    callWithFallback<AdminBankAccount>(
      "patch",
      API_ENDPOINTS.adminCheckout.bankAccounts.id(id),
      API_ENDPOINTS.adminCheckout.bankAccounts.fallbackId(id),
      data,
    ),

  deleteBankAccount: (id: string) =>
    callWithFallback<unknown>(
      "delete",
      API_ENDPOINTS.adminCheckout.bankAccounts.id(id),
      API_ENDPOINTS.adminCheckout.bankAccounts.fallbackId(id),
    ),

  // ── Stats ──────────────────────────────────────────────────────
  getStats: () =>
    callWithFallback<CheckoutStats>(
      "get",
      API_ENDPOINTS.adminCheckout.stats.base,
      API_ENDPOINTS.adminCheckout.stats.fallback,
    ),

  // ── Orders ─────────────────────────────────────────────────────
  getOrders: (params: AdminOrderListParams) => {
    // Drop empty strings so backend enum validation doesn't choke.
    const cleanParams: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== "" && value !== undefined) cleanParams[key] = value;
    }
    return callWithFallback<OrdersEnvelope>(
      "get",
      API_ENDPOINTS.adminCheckout.orders.base,
      API_ENDPOINTS.adminCheckout.orders.fallback,
      undefined,
      { params: cleanParams, raw: true },
    );
  },

  // ── Combined orders (gateway + manual, backend-merged) ─────────────
  // `GET /all-orders` — one backend-paginated, filterable, normalized list.
  // Uses `{ raw: true }` to keep the sibling `meta` (the client unwrap would
  // otherwise return just `data`). Maps the UI's source filter to the
  // endpoint's ALL/ONLINE/MANUAL enum; other filters pass through as-is.
  getAllOrders: (params: AdminOrderListParams) => {
    const cleanParams: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key === "source") continue; // mapped below
      if (value !== "" && value !== undefined) cleanParams[key] = value;
    }
    cleanParams.source = SOURCE_TO_BACKEND[params.source ?? "all"] ?? "ALL";
    return api.get<AllOrdersEnvelope>(API_ENDPOINTS.allOrders, {
      params: cleanParams,
      raw: true,
    });
  },

  getOrderDetail: (manualOrderId: string) =>
    callWithFallback<ManualOrder>(
      "get",
      API_ENDPOINTS.adminCheckout.orders.id(manualOrderId),
      API_ENDPOINTS.adminCheckout.orders.fallbackId(manualOrderId),
    ),

  confirmPayment: (
    manualOrderId: string,
    data: { confirmedAmountPaid: number; note?: string },
  ) =>
    callWithFallback<ManualOrder>(
      "post",
      API_ENDPOINTS.adminCheckout.orders.validate(manualOrderId),
      API_ENDPOINTS.adminCheckout.orders.fallbackValidate(manualOrderId),
      data,
    ),

  rejectPayment: (manualOrderId: string, data: { rejectionReason: string }) =>
    callWithFallback<ManualOrder>(
      "post",
      API_ENDPOINTS.adminCheckout.orders.reject(manualOrderId),
      API_ENDPOINTS.adminCheckout.orders.fallbackReject(manualOrderId),
      data,
    ),

  updateStatus: (
    manualOrderId: string,
    data: {
      orderStatus: string;
      note?: string;
      riderName?: string;
      riderPhone?: string;
      cancelReason?: string;
    },
  ) =>
    callWithFallback<ManualOrder>(
      "patch",
      API_ENDPOINTS.adminCheckout.orders.status(manualOrderId),
      API_ENDPOINTS.adminCheckout.orders.fallbackStatus(manualOrderId),
      data,
    ),

  cancelOrder: (orderId: string, data: { reason: string }) =>
    api.patch<ManualOrder>(
      API_ENDPOINTS.adminCheckout.orders.cancel(orderId),
      data,
    ),

  // ── Gateway orders (main order module) ─────────────────────────────
  // These return inner payloads directly: the order module wraps in
  // `{ success, data }`, which the client unwraps (ADR-0007). The list nests
  // pagination INSIDE `data`, so no `{ raw: true }` is needed (unlike the
  // manual list, whose `meta` is a sibling of `data`).
  getGatewayOrders: (params: GatewayOrderListParams) => {
    const cleanParams: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== "" && value !== undefined) cleanParams[key] = value;
    }
    return api.get<GatewayOrderListResponse>(
      API_ENDPOINTS.gatewayOrders.list,
      { params: cleanParams },
    );
  },

  getGatewayOrderDetail: (orderId: string) =>
    api.get<GatewayOrder>(API_ENDPOINTS.gatewayOrders.detail(orderId)),

  getGatewayOrderHistory: (orderId: string) =>
    api.get<GatewayStatusHistoryEntry[]>(
      API_ENDPOINTS.gatewayOrders.history(orderId),
    ),

  updateGatewayStatus: (
    orderId: string,
    data: { status: string; notes?: string },
  ) => api.patch<GatewayOrder>(API_ENDPOINTS.gatewayOrders.status(orderId), data),

  cancelGatewayOrder: (orderId: string, data: { reason: string }) =>
    api.patch<GatewayOrder>(API_ENDPOINTS.gatewayOrders.cancel(orderId), data),
};
