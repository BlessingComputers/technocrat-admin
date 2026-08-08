import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { monitorService } from "./monitor.service";
import type {
  MonitorAnomaliesParams,
  MonitorErrorsOrSlowParams,
  MonitorRequestsParams,
  MonitorStatsParams,
} from "../types/monitor";

export const monitorKeys = {
  all: ["monitor"] as const,
  requests: (params: MonitorRequestsParams) =>
    [...monitorKeys.all, "requests", params] as const,
  request: (requestId: string) =>
    [...monitorKeys.all, "request", requestId] as const,
  errors: (params: MonitorErrorsOrSlowParams) =>
    [...monitorKeys.all, "errors", params] as const,
  slow: (params: MonitorErrorsOrSlowParams) =>
    [...monitorKeys.all, "slow", params] as const,
  anomalies: (params: MonitorAnomaliesParams) =>
    [...monitorKeys.all, "anomalies", params] as const,
  stats: (params: MonitorStatsParams) =>
    [...monitorKeys.all, "stats", params] as const,
};

function useMonitorLogList(
  queryKey: readonly unknown[],
  queryFn: () => ReturnType<typeof monitorService.listRequests>,
) {
  const query = useQuery({ queryKey, queryFn, placeholderData: keepPreviousData });

  return {
    rows: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useMonitorRequests(params: MonitorRequestsParams) {
  return useMonitorLogList(monitorKeys.requests(params), () =>
    monitorService.listRequests(params),
  );
}

export function useMonitorRequestDetail(requestId: string) {
  return useQuery({
    queryKey: monitorKeys.request(requestId),
    queryFn: () => monitorService.getRequestDetail(requestId),
    enabled: !!requestId,
  });
}

export function useMonitorErrors(params: MonitorErrorsOrSlowParams) {
  return useMonitorLogList(monitorKeys.errors(params), () =>
    monitorService.listErrors(params),
  );
}

export function useMonitorSlow(params: MonitorErrorsOrSlowParams) {
  return useMonitorLogList(monitorKeys.slow(params), () =>
    monitorService.listSlow(params),
  );
}

export function useMonitorAnomalies(params: MonitorAnomaliesParams) {
  const query = useQuery({
    queryKey: monitorKeys.anomalies(params),
    queryFn: () => monitorService.listAnomalies(params),
    placeholderData: keepPreviousData,
  });

  return {
    anomalies: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useMonitorStats(params: MonitorStatsParams) {
  return useQuery({
    queryKey: monitorKeys.stats(params),
    queryFn: () => monitorService.getStats(params),
    placeholderData: keepPreviousData,
  });
}
