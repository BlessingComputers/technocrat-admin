import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { rewardsService } from "./rewards.service";
import type {
  AdjustmentInput,
  PaidInput,
  RewardRateInput,
} from "../types/rewards";

export const rewardKeys = {
  all: ["rewards"] as const,
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
  });
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
