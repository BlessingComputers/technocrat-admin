import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/api/error-message";
import { invoiceService } from "./invoice.service";
import type {
  InvoiceListParams,
  ManualInvoiceListParams,
  RefundItemInput,
  SubmitReviewItem,
} from "../types/invoice";
import type { CreateManualInvoiceInput } from "../schemas/manual-invoice";

export const invoiceKeys = {
  all: ["invoices"] as const,
  dashboard: () => [...invoiceKeys.all, "dashboard"] as const,
  workload: () => [...invoiceKeys.all, "workload"] as const,
  list: (params: InvoiceListParams) =>
    [...invoiceKeys.all, "list", params] as const,
  pendingReview: (params: InvoiceListParams) =>
    [...invoiceKeys.all, "pending-review", params] as const,
  rejected: (params: InvoiceListParams) =>
    [...invoiceKeys.all, "rejected", params] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
  refundItems: (id: string) =>
    [...invoiceKeys.all, "refund-items", id] as const,
  manualList: (params: ManualInvoiceListParams) =>
    [...invoiceKeys.all, "manual", "list", params] as const,
  manualDetail: (id: string) =>
    [...invoiceKeys.all, "manual", "detail", id] as const,
};

// ── Reads ────────────────────────────────────────────────────────
export function useInvoiceDashboard() {
  return useQuery({
    queryKey: invoiceKeys.dashboard(),
    queryFn: () => invoiceService.getDashboard(),
    retry: 1,
  });
}

export function useInvoices(params: InvoiceListParams, enabled = true) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoiceService.getInvoices(params),
    enabled,
    retry: 1,
  });
}

export function usePendingReview(params: InvoiceListParams) {
  return useQuery({
    queryKey: invoiceKeys.pendingReview(params),
    queryFn: () => invoiceService.getPendingReview(params),
    retry: 1,
  });
}

export function useRejectedInvoices(params: InvoiceListParams) {
  return useQuery({
    queryKey: invoiceKeys.rejected(params),
    queryFn: () => invoiceService.getRejected(params),
    retry: 1,
  });
}

export function useInvoiceDetail(invoiceId: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(invoiceId),
    queryFn: () => invoiceService.getInvoice(invoiceId),
    enabled: !!invoiceId,
    retry: 1,
  });
}

export function useInvoiceRefundItems(invoiceId: string, enabled = true) {
  return useQuery({
    queryKey: invoiceKeys.refundItems(invoiceId),
    queryFn: () => invoiceService.getRefundItems(invoiceId),
    enabled: !!invoiceId && enabled,
    retry: 1,
  });
}

// ── Manual invoices ──────────────────────────────────────────────
export function useManualInvoices(
  params: ManualInvoiceListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: invoiceKeys.manualList(params),
    queryFn: () => invoiceService.getManualInvoices(params),
    enabled,
    retry: 1,
  });
}

export function useManualInvoiceDetail(manualInvoiceId: string) {
  return useQuery({
    queryKey: invoiceKeys.manualDetail(manualInvoiceId),
    queryFn: () => invoiceService.getManualInvoice(manualInvoiceId),
    enabled: !!manualInvoiceId,
    retry: 1,
  });
}

export function useCreateManualInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateManualInvoiceInput) =>
      invoiceService.createManualInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Manual invoice created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create manual invoice"));
    },
  });
}

export function useCancelManualInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (manualInvoiceId: string) =>
      invoiceService.cancelManualInvoice(manualInvoiceId),
    onSuccess: (_, manualInvoiceId) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.manualDetail(manualInvoiceId),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Manual invoice cancelled");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to cancel manual invoice"));
    },
  });
}

// ── Mutations ────────────────────────────────────────────────────
export function useClaimInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => invoiceService.claim(invoiceId),
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Invoice claimed — you are now the assigned representative");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to claim invoice"));
    },
  });
}

export function useReassignInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, staffId }: { invoiceId: string; staffId: string }) =>
      invoiceService.reassign(invoiceId, staffId),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Invoice reassigned");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to reassign invoice"));
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      itemReviews,
    }: {
      invoiceId: string;
      itemReviews: SubmitReviewItem[];
    }) => invoiceService.submitReview(invoiceId, itemReviews),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Review submitted — processing the outcome");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to submit review"));
    },
  });
}

export function useRefundItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      items,
    }: {
      invoiceId: string;
      items: RefundItemInput[];
    }) => invoiceService.refund(invoiceId, items),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.refundItems(invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Refund recorded");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to record refund"));
    },
  });
}

export function useConfirmRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      refundItemIds,
    }: {
      invoiceId: string;
      refundItemIds?: string[];
    }) => invoiceService.confirmRefund(invoiceId, refundItemIds),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.refundItems(invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success("Refund confirmed");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to confirm refund"));
    },
  });
}
