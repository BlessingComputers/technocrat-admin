"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { periodToDateRange } from "../utils/period-to-range";
import type { UploaderSort } from "../utils/filter-sort-uploaders";

/**
 * URL-state for the Upload Management page. Per ADR-0005, the date range, search,
 * and sort live in the URL — deep-linkable, reload-safe, and back/forward-aware.
 *
 * History policy (ADR-0010): the search box updates the URL with `replace`
 * (debounced) so typing doesn't spam history; range and sort use `push` so Back
 * steps through deliberate actions. Commits use the History API directly so
 * `useSearchParams` — and the params this hook derives — update synchronously,
 * letting the TanStack Query fetch fire immediately.
 */
const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_SORT: UploaderSort = "today";
const SORTS: UploaderSort[] = ["today", "total", "target", "name"];

interface DateRange {
  startDate: string;
  endDate: string;
}

interface UploaderFilters {
  range: DateRange;
  search?: string;
  sort: UploaderSort;
}

function parseSort(value: string | null): UploaderSort {
  return value && (SORTS as string[]).includes(value)
    ? (value as UploaderSort)
    : DEFAULT_SORT;
}

/** Parse the URL query into resolved filters (relative 30-day default applied). */
function parseParams(sp: URLSearchParams): UploaderFilters {
  const fallback = periodToDateRange("30d", null);
  return {
    range: {
      startDate: sp.get("from") || fallback.startDate,
      endDate: sp.get("to") || fallback.endDate,
    },
    search: sp.get("search") || undefined,
    sort: parseSort(sp.get("sort")),
  };
}

/** Serialize filters back to a query string, omitting defaults for clean URLs. */
function toQueryString(filters: UploaderFilters): string {
  const sp = new URLSearchParams();
  if (filters.search) sp.set("search", filters.search);
  // Only pin explicit dates when they differ from today's rolling default, so an
  // untouched page keeps a clean URL but any chosen window is reproducible.
  const def = periodToDateRange("30d", null);
  if (
    filters.range.startDate !== def.startDate ||
    filters.range.endDate !== def.endDate
  ) {
    sp.set("from", filters.range.startDate);
    sp.set("to", filters.range.endDate);
  }
  if (filters.sort !== DEFAULT_SORT) sp.set("sort", filters.sort);
  return sp.toString();
}

export function useUploaderFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => parseParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // The search box is controlled locally so typing is instant; a debounced timer
  // mirrors it into the URL. `synced` records the URL value the box was last
  // reconciled with, so an external URL change (back/forward) is picked up during
  // render — the "adjust state when a prop changes" pattern, no setState-in-effect.
  const [searchBox, setSearchBox] = useState(() => ({
    value: params.search ?? "",
    synced: params.search ?? "",
  }));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const urlSearch = params.search ?? "";
  if (searchBox.synced !== urlSearch) {
    setSearchBox({ value: urlSearch, synced: urlSearch });
  }
  const searchInput = searchBox.value;

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const commit = useCallback(
    (next: UploaderFilters, mode: "push" | "replace") => {
      const qs = toQueryString(next);
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [pathname],
  );

  const setRange = useCallback(
    (range: DateRange) => commit({ ...params, range }, "push"),
    [commit, params],
  );

  const setSort = useCallback(
    (sort: UploaderSort) => commit({ ...params, sort }, "push"),
    [commit, params],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchBox((s) => ({ ...s, value }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        commit({ ...params, search: value || undefined }, "replace");
      }, SEARCH_DEBOUNCE_MS);
    },
    [commit, params],
  );

  return { params, searchInput, setRange, setSort, setSearch };
}
