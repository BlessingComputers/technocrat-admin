"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { periodToDateRange } from "../utils/period-to-range";

/**
 * URL-state for the uploader detail page: date range, active tab, and page.
 * Same ADR-0005/0010 approach as the management list, minus the debounced search
 * (there is none here), so it's a plain History-API commit.
 */
export type UploaderTab = "products" | "parts";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DetailFilters {
  range: DateRange;
  tab: UploaderTab;
  page: number;
}

function parseParams(sp: URLSearchParams): DetailFilters {
  const fallback = periodToDateRange("30d", null);
  const page = Number(sp.get("page"));
  return {
    range: {
      startDate: sp.get("from") || fallback.startDate,
      endDate: sp.get("to") || fallback.endDate,
    },
    tab: sp.get("tab") === "parts" ? "parts" : "products",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

function toQueryString(filters: DetailFilters): string {
  const sp = new URLSearchParams();
  const def = periodToDateRange("30d", null);
  if (
    filters.range.startDate !== def.startDate ||
    filters.range.endDate !== def.endDate
  ) {
    sp.set("from", filters.range.startDate);
    sp.set("to", filters.range.endDate);
  }
  if (filters.tab !== "products") sp.set("tab", filters.tab);
  if (filters.page > 1) sp.set("page", String(filters.page));
  return sp.toString();
}

export function useUploaderDetailFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => parseParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const commit = useCallback(
    (next: DetailFilters) => {
      const qs = toQueryString(next);
      window.history.pushState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname],
  );

  // Changing the window or tab resets pagination; paging keeps everything else.
  const setRange = useCallback(
    (range: DateRange) => commit({ ...params, range, page: 1 }),
    [commit, params],
  );
  const setTab = useCallback(
    (tab: UploaderTab) => commit({ ...params, tab, page: 1 }),
    [commit, params],
  );
  const setPage = useCallback(
    (page: number) => commit({ ...params, page }),
    [commit, params],
  );

  return { ...params, setRange, setTab, setPage };
}
