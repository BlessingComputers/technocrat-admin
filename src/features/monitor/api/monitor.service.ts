import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  MonitorAnomaliesParams,
  MonitorAnomaly,
  MonitorErrorsOrSlowParams,
  MonitorLogDetail,
  MonitorLogListEnvelope,
  MonitorRequestsParams,
  MonitorStats,
  MonitorStatsParams,
} from "../types/monitor";

const { monitor } = API_ENDPOINTS;

export const monitorService = {
  // `meta` is a sibling of `data`, not nested — `raw: true` so it survives
  // the client's envelope unwrap (see PromotionsListEnvelope precedent).
  listRequests: (params?: MonitorRequestsParams) =>
    api.get<MonitorLogListEnvelope>(monitor.requests, { params, raw: true }),

  getRequestDetail: (requestId: string) =>
    api.get<MonitorLogDetail>(monitor.request(requestId)),

  listErrors: (params?: MonitorErrorsOrSlowParams) =>
    api.get<MonitorLogListEnvelope>(monitor.errors, { params, raw: true }),

  listSlow: (params?: MonitorErrorsOrSlowParams) =>
    api.get<MonitorLogListEnvelope>(monitor.slow, { params, raw: true }),

  // Flat array under `data`, no sibling meta — normal unwrap is enough.
  listAnomalies: (params?: MonitorAnomaliesParams) =>
    api.get<MonitorAnomaly[]>(monitor.anomalies, { params }),

  getStats: (params?: MonitorStatsParams) =>
    api.get<MonitorStats>(monitor.stats, { params }),
};
