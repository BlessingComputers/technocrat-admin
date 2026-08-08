import type { components } from "@/types/api";

/**
 * Monitor feature types, off codegen. `/monitor/requests` returns `{ success,
 * data, meta }` with `meta` as a SIBLING of `data` (same shape as
 * promotions — ADR-0007's known risk), so the service reads it with
 * `raw: true`. `/monitor/stats` and `/monitor/anomalies` nest everything
 * under `data` with no sibling meta, so those unwrap normally.
 */

export type MonitorLogListItem = components["schemas"]["MonitorLogListItem"];
export type MonitorLogDetail = components["schemas"]["MonitorLogDetail"];
export type MonitorError = components["schemas"]["MonitorError"];
export type MonitorErrorDetail = components["schemas"]["MonitorErrorDetail"];
export type MonitorStats = components["schemas"]["MonitorStatsResponse"]["data"];
export type MonitorAnomaly =
  components["schemas"]["MonitorAnomalyListResponse"]["data"][number];

export interface MonitorListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MonitorLogListEnvelope {
  success?: boolean;
  data: MonitorLogListItem[];
  meta: MonitorListMeta;
}

/** `GET /monitor/requests` query params. */
export interface MonitorRequestsParams {
  status?: string;
  method?: string;
  path?: string;
  tag?: string;
  from?: string;
  to?: string;
  minDuration?: string;
  userId?: string;
  staffId?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

/** `GET /monitor/errors` and `GET /monitor/slow` query params — pre-filtered
 * server-side, so no status/method/tag knobs. */
export interface MonitorErrorsOrSlowParams {
  from?: string;
  to?: string;
  path?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

/** `GET /monitor/anomalies` query params — flat array response, no `meta`. */
export interface MonitorAnomaliesParams {
  type?: "error_rate_spike" | "latency_spike";
  from?: string;
  to?: string;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

/** `GET /monitor/stats` query params. */
export interface MonitorStatsParams {
  hours?: number;
  [key: string]: string | number | boolean | undefined;
}
