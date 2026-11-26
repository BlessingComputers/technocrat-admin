import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { REWARDS_QUERY_KEY } from "@/lib/utils/catalog-edit-refresh";

import { staffHistory } from "../model/reward-rules";
import { rewardsService } from "./rewards.service";
import type {
  AdjustmentInput,
  PaidInput,
  RewardRateInput,
} from "../types/rewards";

export const rewardKeys = {
  all: REWARDS_QUERY_KEY,
  me: () => [...rewardKeys.all, "me"] as const,
  months: () => [...rewardKeys.all, "months"] as const,
  month: (month?: string) =>
    [...rewardKeys.all, "month", month ?? "open"] as const,
  rate: () => [...rewardKeys.all, "rate"] as const,
};

export function useMyRewards() {
  return useQuery({
    queryKey: rewardKeys.me(),
    queryFn: () => rewardsService.getMine(),
  });
}

export function useRewardMonths(enabled: boolean) {
  return useQuery({
    queryKey: rewardKeys.months(),
    queryFn: () => rewardsService.getMonths(),
    enabled,
  });
}

export function useRewardMonth(month: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: rewardKeys.month(month),
    queryFn: () => rewardsService.getMonth(month),
    enabled,
    // Keep the last month on screen while the picked one loads.
    placeholderData: keepPreviousData,
  });
}

/**
 * Every month for one uploader, newest first. No backend route gives this yet
 * (Technocrat ask 23, issue #311), so it loads each month and keeps the uploader's row.
 * The open month uses the team page's cache entry (no month = open).
 */
export function useStaffRewardHistory(staffId: string, enabled: boolean) {
  const months = useRewardMonths(enabled);
  const monthQueries = useQueries({
    queries: (months.data ?? []).map((m) => {
      const month = m.closedAt ? m.month : undefined;
      return {
        queryKey: rewardKeys.month(month),
        queryFn: () => rewardsService.getMonth(month),
        enabled,
      };
    }),
  });

  const loaded = monthQueries.flatMap((q) => (q.data ? [q.data] : []));
  return {
    rows: staffHistory(loaded, staffId),
    isLoading: months.isLoading || monthQueries.some((q) => q.isLoading),
    isError: months.isError || monthQueries.some((q) => q.isError),
    refetch: () => {
      void months.refetch();
      monthQueries.forEach((q) => void q.refetch());
    },
  };
}

export function useRewardRate(enabled: boolean) {
  return useQuery({
    queryKey: rewardKeys.rate(),
    queryFn: () => rewardsService.getRate(),
    enabled,
  });
}

/** Every write can move the open month, the month table and "My rewards". */
function useInvalidateRewards() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: rewardKeys.all });
}

export function useUpdateRewardRate() {
  const invalidate = useInvalidateRewards();
  return useMutation({
    mutationFn: (input: RewardRateInput) => rewardsService.updateRate(input),
    onSuccess: invalidate,
  });
}

export function useAdjustReward() {
  const invalidate = useInvalidateRewards();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdjustmentInput }) =>
      rewardsService.adjust(id, input),
    // A 409 means someone else changed the row, so refresh on error too.
    onSettled: invalidate,
  });
}

export function useMarkRewardPaid() {
  const invalidate = useInvalidateRewards();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PaidInput }) =>
      rewardsService.markPaid(id, input),
    onSettled: invalidate,
  });
}
