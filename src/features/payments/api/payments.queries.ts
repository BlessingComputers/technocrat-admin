import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/api/error-message";
import { paymentsService } from "./payments.service";
import type {
  AdminTransactionListParams,
  DlqListParams,
  RecordRefundRequest,
} from "../types/payments";

export const paymentsKeys = {
  all: ["payments"] as const,
  transactions: (params: AdminTransactionListParams) =>
    [...paymentsKeys.all, "transactions", params] as const,
  transaction: (paymentId: string) =>
    [...paymentsKeys.all, "transaction", paymentId] as const,
  dlq: (params: DlqListParams) => [...paymentsKeys.all, "dlq", params] as const,
  circuit: () => [...paymentsKeys.all, "circuit"] as const,
};

// ── Transactions ──────────────────────────────────────────────────────────

export function useTransactions(params: AdminTransactionListParams) {
  const query = useQuery({
    queryKey: paymentsKeys.transactions(params),
    queryFn: () => paymentsService.getTransactions(params),
    placeholderData: keepPreviousData,
  });

  return {
    rows: query.data?.data ?? [],
    meta: query.data
      ? {
          total: query.data.total,
          page: query.data.page,
          limit: query.data.limit,
          totalPages: query.data.totalPages,
        }
      : undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useTransactionDetail(paymentId: string) {
  return useQuery({
    queryKey: paymentsKeys.transaction(paymentId),
    queryFn: () => paymentsService.getTransactionDetail(paymentId),
    enabled: !!paymentId,
  });
}

export function useRecordRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordRefundRequest) =>
      paymentsService.recordRefund(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success(`Refund of ${variables.paymentId} recorded`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to record refund"));
    },
  });
}

// ── DLQ ───────────────────────────────────────────────────────────────────

export function useDlq(params: DlqListParams) {
  const query = useQuery({
    queryKey: paymentsKeys.dlq(params),
    queryFn: () => paymentsService.getDlq(params),
    placeholderData: keepPreviousData,
  });

  return {
    entries: query.data?.entries ?? [],
    meta: query.data
      ? {
          total: query.data.total,
          page: query.data.page,
          limit: query.data.limit,
          totalPages: query.data.totalPages,
        }
      : undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useReplayDlqEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsService.replayDlqEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsKeys.all });
      toast.success("Job replayed — back on the live queue");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to replay job"));
    },
  });
}

// ── Miden / circuit tools ───────────────────────────────────────────────────

export function useCircuitHealth() {
  return useQuery({
    queryKey: paymentsKeys.circuit(),
    queryFn: () => paymentsService.getCircuitHealth(),
    // The circuit trips and recovers on its own — poll so "is it open right
    // now" stays current without a manual refresh during an incident.
    refetchInterval: 30_000,
  });
}

export function useRegisterMidenWebhook() {
  return useMutation({
    mutationFn: (baseUrl: string) =>
      paymentsService.registerMidenWebhook(baseUrl),
    onSuccess: (data) => {
      toast.success(data.responseMessage || "Webhook registered");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to register webhook"));
    },
  });
}

export function useResendMidenWebhook() {
  return useMutation({
    mutationFn: (transactionIds: number[]) =>
      paymentsService.resendMidenWebhook(transactionIds),
    onSuccess: (data) => {
      toast.success(data.responseMessage || "Resend requested");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to resend webhook"));
    },
  });
}

export function useLookupMidenTransaction() {
  return useMutation({
    mutationFn: (reference: string) =>
      paymentsService.lookupMidenTransaction(reference),
    onError: (error) => {
      toast.error(getErrorMessage(error, "Lookup failed"));
    },
  });
}
