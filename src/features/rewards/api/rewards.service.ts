import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdjustmentInput,
  MyRewards,
  PaidInput,
  RewardMonth,
  RewardMonthRef,
  RewardRate,
  RewardRateInput,
  RewardRow,
} from "../types/rewards";

const { rewards } = API_ENDPOINTS.analytics;

export const rewardsService = {
  /** Any staff: the caller's open month (live) and closed months. */
  getMine: () => api.get<MyRewards>(rewards.me),

  /** `rewards` group: the open month plus every closed month, newest first. */
  getMonths: () => api.get<RewardMonthRef[]>(rewards.months),

  /** `rewards` group: one row per uploader. No month = the open month. */
  getMonth: (month?: string) =>
    api.get<RewardMonth>(rewards.base, {
      params: month ? { month } : undefined,
    }),

  getRate: () => api.get<RewardRate>(rewards.rate),

  /** `rewards:manage`. Applies to the open month from its first day. */
  updateRate: (input: RewardRateInput) =>
    api.put<RewardRate>(rewards.rate, input),

  /** `rewards:manage`. 400 REWARD_NEGATIVE_TOTAL, 409 REWARD_ALREADY_PAID. */
  adjust: (id: string, input: AdjustmentInput) =>
    api.patch<RewardRow>(rewards.adjustment(id), input),

  /** `rewards:pay`. 409 REWARD_ALREADY_PAID. */
  markPaid: (id: string, input: PaidInput) =>
    api.post<RewardRow>(rewards.paid(id), input),
};
