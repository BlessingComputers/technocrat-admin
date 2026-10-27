import { useMemo } from "react";
import {
  useQuery,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { monitorService } from "./monitor.service";
import type {
  MonitorAnomaliesParams,
  MonitorErrorsOrSlowParams,
  MonitorLogListEnvelope,
  MonitorLogListItem,
  MonitorRequestsParams,
  MonitorStatsParams,
} from "../types/monitor";

export const monitorKeys = {
  all: ["monitor"] as const,
  requestsInfinite: (params: MonitorRequestsParams) =>
    [...monitorKeys.all, "requests", "infinite", params] as const,
  request: (requestId: string) =>
    [...monitorKeys.all, "request", requestId] as const,
  errorsInfinite: (params: MonitorErrorsOrSlowParams) =>
    [...monitorKeys.all, "errors", "infinite", params] as const,
  slowInfinite: (params: MonitorErrorsOrSlowParams) =>
    [...monitorKeys.all, "slow", "infinite", params] as const,
  anomalies: (params: MonitorAnomaliesParams) =>
    [...monitorKeys.all, "anomalies", params] as const,
  stats: (params: MonitorStatsParams) =>
    [...monitorKeys.all, "stats", params] as const,
};

/** Page cursor: the page number plus the frozen upper bound of the window it
 * was taken from (see `useInfiniteMonitorLogList`). */
interface MonitorPageParam {
  page: number;
  to?: string;
}

/** Flattens the loaded pages and drops repeats by `requestId`.
 *
 * The backend pages with `skip`/`limit` over a `timestamp: -1` sort, so even
 * with a pinned window a row sitting exactly on a page boundary can come back
 * twice (timestamps are not unique, and Mongo's sort is unstable on ties).
 * Duplicate React keys are a hard error, so the guard stays regardless. */
function flattenUniqueRows(
  pages: (MonitorLogListEnvelope | undefined)[],
): MonitorLogListItem[] {
  const seen = new Set<string>();
  const rows: MonitorLogListItem[] = [];

  for (const page of pages) {
    for (const row of page?.data ?? []) {
      if (row.requestId) {
        if (seen.has(row.requestId)) continue;
        seen.add(row.requestId);
      }
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Shared infinite-scroll list hook for the three log lists (`requests`,
 * `errors`, `slow`). All three share the `{ data, meta }` envelope, so paging
 * is identical: `meta.page < meta.totalPages` drives the next page param.
 *
 * ── Why the window is pinned ────────────────────────────────────────────────
 * The log is append-heavy and the backend pages by `skip`/`limit` over a
 * newest-first sort, so rows shift down between fetches — our own page
 * requests are themselves logged, guaranteeing drift. Offset paging on a
 * moving set repeats rows (duplicate React keys) and silently skips others.
 *
 * So page 1 is fetched live, and every page after it carries `to` = the
 * timestamp of page 1's newest row. `to` maps to `timestamp: { $lte }`
 * server-side, which freezes the set the offsets are counted against. Reading
 * the newest row rather than the client clock keeps this immune to clock skew
 * between the browser and the server. New logs land above the pin and appear
 * on the next refresh.
 *
 * `refetchOnWindowFocus` is off deliberately - an infinite query refetches
 * EVERY loaded page on focus, which would stall a deep scroll and re-order
 * rows mid-read. The explicit refresh button is the way to pull new logs.
 */
function useInfiniteMonitorLogList(
  queryKey: readonly unknown[],
  fetchPage: (pageParam: MonitorPageParam) => Promise<MonitorLogListEnvelope>,
  /** An explicit `to` filter, when the caller sets one, wins over the pin. */
  explicitTo?: string,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: { page: 1, to: explicitTo } as MonitorPageParam,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const meta = lastPage?.meta;
      if (!meta || meta.page >= meta.totalPages) return undefined;

      return {
        page: meta.page + 1,
        to:
          explicitTo ??
          allPages[0]?.data?.[0]?.timestamp ??
          lastPageParam.to,
      };
    },
    // Filter changes swap the key; holding the previous rows keeps the list
    // from collapsing to a skeleton and losing scroll position.
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const pages = query.data?.pages;
  const rows = useMemo(() => flattenUniqueRows(pages ?? []), [pages]);

  return {
    rows,
    /** Total rows in the pinned window, for the "x of y" footer. Read off the
     * newest page, not page 1: page 1 is unpinned and counts rows that landed
     * after the window closed, which the stream will never reach. */
    total: pages?.[pages.length - 1]?.meta?.total,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

export type MonitorInfiniteList = ReturnType<typeof useInfiniteMonitorLogList>;

export function useMonitorRequests(params: MonitorRequestsParams) {
  return useInfiniteMonitorLogList(
    monitorKeys.requestsInfinite(params),
    ({ page, to }) => monitorService.listRequests({ ...params, page, to }),
    params.to,
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
  return useInfiniteMonitorLogList(
    monitorKeys.errorsInfinite(params),
    ({ page, to }) => monitorService.listErrors({ ...params, page, to }),
    params.to,
  );
}

export function useMonitorSlow(params: MonitorErrorsOrSlowParams) {
  return useInfiniteMonitorLogList(
    monitorKeys.slowInfinite(params),
    ({ page, to }) => monitorService.listSlow({ ...params, page, to }),
    params.to,
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
