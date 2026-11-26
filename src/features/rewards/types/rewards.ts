import type { paths } from "@/types/api";

/**
 * Types for the uploader rewards (ask 20). Aliased by path from the generated
 * OpenAPI types (ADR-0006), so they track the backend contract.
 */

type Json<T> = T extends { content: { "application/json": infer B } } ? B : never;

type MonthOk = Json<
  paths["/api/v1/analytics/rewards"]["get"]["responses"][200]
>;
type MeOk = Json<
  paths["/api/v1/analytics/rewards/me"]["get"]["responses"][200]
>;
type MonthsOk = Json<
  paths["/api/v1/analytics/rewards/months"]["get"]["responses"][200]
>;
type RateOk = Json<
  paths["/api/v1/analytics/rewards/rate"]["get"]["responses"][200]
>;

/** Inner payloads (the client unwraps the envelope, ADR-0007). */
export type RewardMonth = MonthOk["data"];
export type MyRewards = MeOk["data"];
export type RewardMonthRef = MonthsOk["data"][number];
export type RewardRate = RateOk["data"];

/** One uploader's month. `id` is null for the open (live) month. */
export type RewardRow = RewardMonth["statements"][number];

export interface RewardRateInput {
  uploadRate: number;
  updateRate: number;
}

export interface AdjustmentInput {
  adjustment: number;
  reason: string;
}

export interface PaidInput {
  /** `YYYY-MM-DD`; the backend defaults to today (UTC). */
  paidAt?: string;
  note?: string;
}
