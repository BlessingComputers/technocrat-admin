import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { preorderService } from "./preorder.service";
import {
  mergePaymentHistory,
  mergePaymentSummaryRequest,
} from "../utils/payment-history";
import {
  PREORDER_STATUSES,
  type Preorder,
  type IssuePaymentTermsInput,
  type PreorderPaymentRequest,
  type PreorderPaymentSummary,
  type RejectPaymentEvidenceInput,
  type PreordersListParams,
  type PreordersPage,
  type PreorderStatus,
} from "../types/preorders";

export const preorderKeys = {
  all: ["preorders"] as const,
  list: (params: PreordersListParams) =>
    [...preorderKeys.all, "list", params] as const,
  detail: (id: string) => [...preorderKeys.all, "detail", id] as const,
  counts: () => [...preorderKeys.all, "counts"] as const,
  count: (status: PreorderStatus) =>
    [...preorderKeys.counts(), status] as const,
  receivingAccounts: () => [...preorderKeys.all, "receiving-accounts"] as const,
  paymentHistory: (id: string) =>
    [...preorderKeys.detail(id), "payment-history"] as const,
};

/**
 * A queue is worked, not browsed, so it is kept fresher than the reference
 * lists elsewhere in the app (customers uses five minutes). Thirty seconds is
 * short enough that two staff working the same backlog don't spend long acting
 * on each other's stale rows.
 */
const QUEUE_STALE_MS = 30_000;

export function usePreorders(params: PreordersListParams) {
  return useQuery({
    queryKey: preorderKeys.list(params),
    queryFn: () => preorderService.list(params),
    staleTime: QUEUE_STALE_MS,
  });
}

export function usePreorderReceivingAccounts() {
  return useQuery({
    queryKey: preorderKeys.receivingAccounts(),
    queryFn: () => preorderService.getReceivingAccounts(),
  });
}

export function useIssuePreorderPaymentTerms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: IssuePaymentTermsInput }) =>
      preorderService.issuePaymentTerms(id, input),
    onSuccess: (paymentSummary, { id }) => {
      queryClient.setQueryData<Preorder>(preorderKeys.detail(id), (current) =>
        current
          ? { ...current, status: "CONFIRMED", paymentSummary }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: preorderKeys.counts() });
      void queryClient.invalidateQueries({
        queryKey: [...preorderKeys.all, "list"],
      });
    },
  });
}

export function usePreorderPaymentHistory(id: string) {
  return useQuery({
    queryKey: preorderKeys.paymentHistory(id),
    queryFn: () => preorderService.getPaymentHistory(id),
    enabled: Boolean(id),
  });
}

function usePaymentDecisionMutation(
  mutationFn: (input: {
    preorderId: string;
    requestId: string;
    reason?: string;
  }) => Promise<PreorderPaymentSummary | PreorderPaymentRequest>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (result, { preorderId, requestId }) => {
      queryClient.setQueryData<Preorder>(
        preorderKeys.detail(preorderId),
        (current) => {
          if (!current?.paymentSummary) return current;
          if ("plan" in result) return { ...current, paymentSummary: result };
          return {
            ...current,
            paymentSummary: mergePaymentSummaryRequest(current.paymentSummary, result),
          };
        },
      );
      const updatedRequest = "plan" in result
        ? [result.firstPayment, result.balancePayment].find((request) => request?.id === requestId)
        : result;
      queryClient.setQueryData<PreorderPaymentRequest[]>(
        preorderKeys.paymentHistory(preorderId),
        (history) => updatedRequest ? mergePaymentHistory(history, updatedRequest) : history,
      );
      void queryClient.invalidateQueries({ queryKey: [...preorderKeys.all, "list"] });
    },
    onError: (_error, { preorderId }) => {
      void queryClient.invalidateQueries({ queryKey: preorderKeys.detail(preorderId) });
    },
  });
}

export function useReviewPreorderPaymentEvidence() {
  return usePaymentDecisionMutation(({ requestId }) =>
    preorderService.reviewPaymentEvidence(requestId),
  );
}

export function useApprovePreorderPaymentEvidence() {
  return usePaymentDecisionMutation(({ requestId }) =>
    preorderService.approvePaymentEvidence(requestId),
  );
}

export function useRejectPreorderPaymentEvidence() {
  return usePaymentDecisionMutation(({ requestId, reason }) => {
    const input: RejectPaymentEvidenceInput = {
      decisionReason: reason ?? "",
    };
    return preorderService.rejectPaymentEvidence(requestId, input);
  });
}

export function usePreorder(id: string) {
  return useQuery({
    queryKey: preorderKeys.detail(id),
    queryFn: () => preorderService.get(id),
    enabled: !!id,
    staleTime: QUEUE_STALE_MS,
  });
}

/**
 * How many pre-orders sit at each status, for the filter chips.
 *
 * There is no counts endpoint, and the list's `total` only ever describes the
 * filter currently applied — so one `limit: 1` request per status and read
 * `total` off each. Five tiny requests against an admin API that allows 120 a
 * minute per staff member, and they are the numbers that make the difference
 * between a table and a queue: without them nobody can see the backlog without
 * clicking through all five filters.
 *
 * `search` is deliberately NOT threaded through. These counts describe the
 * whole queue, and a chip row that silently rescoped itself to the current
 * search would make "PENDING 2" mean two different things on two screens.
 */
export function usePreorderCounts() {
  const results = useQueries({
    queries: PREORDER_STATUSES.map((status) => ({
      queryKey: preorderKeys.count(status),
      queryFn: () => preorderService.list({ status, page: 1, limit: 1 }),
      staleTime: QUEUE_STALE_MS,
      select: (page: PreordersPage) => page.total,
    })),
  });

  const counts = {} as Record<PreorderStatus, number | undefined>;
  PREORDER_STATUSES.forEach((status, i) => {
    counts[status] = results[i]?.data;
  });

  return {
    counts,
    /** Total across every status — the "All" chip. */
    total: results.every((r) => typeof r.data === "number")
      ? results.reduce((sum, r) => sum + (r.data ?? 0), 0)
      : undefined,
    isLoading: results.some((r) => r.isLoading),
    isFetching: results.some((r) => r.isFetching),
    refetch: () => results.forEach((r) => void r.refetch()),
  };
}

/**
 * Move a pre-order along its lifecycle.
 *
 * The PATCH returns the updated row, so the detail cache is seeded from the
 * response rather than refetched. Lists and counts are invalidated instead of
 * patched: a status change usually moves the row out of the filter it is being
 * viewed under, and rewriting it in place would leave it visibly sitting in a
 * list it no longer belongs to.
 */
export function useUpdatePreorderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PreorderStatus }) =>
      preorderService.updateStatus(id, status),
    onSuccess: (updated: Preorder) => {
      queryClient.setQueryData<Preorder>(preorderKeys.detail(updated.id), (current) =>
        current ? { ...current, ...updated } : updated,
      );
      void queryClient.invalidateQueries({ queryKey: preorderKeys.counts() });
      void queryClient.invalidateQueries({
        queryKey: [...preorderKeys.all, "list"],
      });
    },
  });
}
