import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/api/error-message";
import { ordersService } from "./orders.service";
import { allOrdersRowToAdminRow } from "../utils/order-utils";
import type {
  AdminBankAccount,
  AdminOrderListParams,
  AdminOrderRow,
  AllOrdersMeta,
  CheckoutStats,
} from "../types/orders";

// Bounded gateway window for the KPI aggregate only (the combined orders LIST
// is now backend-paginated via `useAllOrders`). The order module exposes no
// stats endpoint, so gateway KPI figures are still derived from a recent slice.
const UNIFIED_FETCH_LIMIT = 100;

export const ordersKeys = {
  all: ["orders"] as const,
  bankAccounts: () => [...ordersKeys.all, "bank-accounts"] as const,
  stats: () => [...ordersKeys.all, "stats"] as const,
  list: (params: AdminOrderListParams) =>
    [...ordersKeys.all, "list", params] as const,
  detail: (id: string) => [...ordersKeys.all, "detail", id] as const,
};

// ── Bank Accounts ──────────────────────────────────────────────
export function useBankAccounts() {
  return useQuery({
    queryKey: ordersKeys.bankAccounts(),
    queryFn: () => ordersService.getBankAccounts(),
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminBankAccount>) =>
      ordersService.createBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.bankAccounts() });
      toast.success("Bank account created");
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminBankAccount> }) =>
      ordersService.updateBankAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.bankAccounts() });
      toast.success("Bank account updated");
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersService.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.bankAccounts() });
      toast.success("Bank account deleted");
    },
  });
}

// ── Stats ──────────────────────────────────────────────────────
export function useCheckoutStats() {
  return useQuery({
    queryKey: ordersKeys.stats(),
    queryFn: () => ordersService.getStats(),
  });
}

// ── KPI cards (manual + gateway) ───────────────────────────────────────────────
/**
 * Merges the manual-checkout stats aggregate (`/checkout/admin/stats`, which
 * counts ONLY `manual_orders`) with gateway-order figures so the KPI cards
 * reflect BOTH flows.
 *
 * The order module exposes no stats endpoint, so gateway figures are derived
 * client-side from an UNFILTERED order fetch (not the search-filtered list).
 * Caveats until a backend combined-stats endpoint lands:
 *  - bounded to the most recent `UNIFIED_FETCH_LIMIT` gateway orders (fine at
 *    current volumes; undercounts beyond that),
 *  - "confirmed today" for gateway uses `createdAt` (online payments settle at
 *    creation, so createdAt ≈ paidAt), and
 *  - "pending review" stays manual-only — it's the proof-verification queue,
 *    which has no gateway equivalent (online payment needs no manual review).
 */
export function useOrderKpis() {
  const manual = useCheckoutStats();
  const gateway = useQuery({
    queryKey: [...ordersKeys.all, "kpi", "gateway"] as const,
    queryFn: () => ordersService.getGatewayOrders({ page: 1, limit: UNIFIED_FETCH_LIMIT }),
  });

  const gwOrders = gateway.data?.orders ?? [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const gwPending = gwOrders.filter((o) => o.paymentStatus === "PENDING");
  const gwAwaitingPayment = gwPending.length;
  const gwRevenuePending = gwPending.reduce((sum, o) => sum + o.totalAmount, 0);
  const gwConfirmedToday = gwOrders.filter(
    (o) => o.paymentStatus === "PAID" && new Date(o.createdAt) >= todayStart,
  ).length;

  const m = manual.data;
  const stats: CheckoutStats = {
    awaitingPayment: (m?.awaitingPayment ?? 0) + gwAwaitingPayment,
    pendingReview: m?.pendingReview ?? 0, // manual proof queue only
    confirmedToday: (m?.confirmedToday ?? 0) + gwConfirmedToday,
    totalRevenuePending: (m?.totalRevenuePending ?? 0) + gwRevenuePending,
  };

  return {
    stats,
    isFetching: manual.isFetching || gateway.isFetching,
    refetch: () => {
      manual.refetch();
      gateway.refetch();
    },
  };
}

// ── Orders ─────────────────────────────────────────────────────

export function useOrderDetail(manualOrderId: string) {
  return useQuery({
    queryKey: ordersKeys.detail(manualOrderId),
    queryFn: () => ordersService.getOrderDetail(manualOrderId),
    enabled: !!manualOrderId,
  });
}

// ── Combined orders (gateway + manual, backend-merged) ─────────────────────────
/**
 * The unified Orders list, now backed by the single `GET /all-orders` endpoint:
 * one true backend-paginated, filterable, sorted page (no more client-side
 * merge of two bounded windows). Rows normalize into `AdminOrderRow`, and —
 * unlike the old merge — gateway rows carry real customer names/emails too.
 * `meta` drives pagination; `keepPreviousData` avoids flicker between pages.
 */
export function useAllOrders(params: AdminOrderListParams) {
  const query = useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: () => ordersService.getAllOrders(params),
    placeholderData: keepPreviousData,
  });

  const rows: AdminOrderRow[] = (query.data?.data ?? []).map(
    allOrdersRowToAdminRow,
  );
  const meta: AllOrdersMeta | undefined = query.data?.meta;

  return {
    rows,
    meta,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

// ── Gateway order detail + mutations (main order module) ───────────────────────
export function useGatewayOrderDetail(orderId: string) {
  return useQuery({
    queryKey: [...ordersKeys.all, "gateway-detail", orderId] as const,
    queryFn: () => ordersService.getGatewayOrderDetail(orderId),
    enabled: !!orderId,
  });
}

export function useGatewayOrderHistory(orderId: string) {
  return useQuery({
    queryKey: [...ordersKeys.all, "gateway-history", orderId] as const,
    queryFn: () => ordersService.getGatewayOrderHistory(orderId),
    enabled: !!orderId,
  });
}

export function useUpdateGatewayStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: { status: string; notes?: string };
    }) => ordersService.updateGatewayStatus(orderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...ordersKeys.all, "gateway-detail", variables.orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [...ordersKeys.all, "gateway-history", variables.orderId],
      });
      toast.success("Order status updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update status"));
    },
  });
}

export function useCancelGatewayOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: { reason: string };
    }) => ordersService.cancelGatewayOrder(orderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...ordersKeys.all, "gateway-detail", variables.orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [...ordersKeys.all, "gateway-history", variables.orderId],
      });
      toast.success("Order cancelled");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to cancel order"));
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      manualOrderId,
      data,
    }: {
      manualOrderId: string;
      data: { confirmedAmountPaid: number; note?: string };
    }) => ordersService.confirmPayment(manualOrderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ordersKeys.detail(variables.manualOrderId),
      });
      queryClient.invalidateQueries({ queryKey: ordersKeys.stats() });
      toast.success("Payment confirmed. Stock decremented.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to confirm payment"));
    },
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      manualOrderId,
      data,
    }: {
      manualOrderId: string;
      data: { rejectionReason: string };
    }) => ordersService.rejectPayment(manualOrderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ordersKeys.detail(variables.manualOrderId),
      });
      queryClient.invalidateQueries({ queryKey: ordersKeys.stats() });
      toast.success("Payment proof rejected");
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      manualOrderId,
      data,
    }: {
      manualOrderId: string;
      data: {
        orderStatus: string;
        note?: string;
        riderName?: string;
        riderPhone?: string;
        cancelReason?: string;
      };
    }) => ordersService.updateStatus(manualOrderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ordersKeys.detail(variables.manualOrderId),
      });
      toast.success("Order status updated");
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      manualOrderId,
      data,
    }: {
      manualOrderId: string;
      data: { reason: string };
    }) => ordersService.cancelOrder(manualOrderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ordersKeys.detail(variables.manualOrderId),
      });
      queryClient.invalidateQueries({ queryKey: ordersKeys.stats() });
      toast.success("Order cancelled and stock released");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to cancel order"));
    },
  });
}
