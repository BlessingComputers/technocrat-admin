"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PartsListParams } from "../types/parts";

/**
 * URL-state for the parts list (`/catalogues/parts`). Per ADR-0005, filter and
 * pagination state live in the URL — deep-linkable, reload-safe, back/forward
 * aware. Mirrors the product browse filters, minus sort (the parts list endpoint
 * has no sort param). Search updates the URL with `replace` (debounced); every
 * other change uses `push` and resets to page 1.
 */
const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_LIMIT = 20;

function toInt(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseParams(sp: URLSearchParams): PartsListParams {
  const status = sp.get("status"); // active | inactive
  const stock = sp.get("stock"); // in | out
  return {
    page: toInt(sp.get("page")) ?? 1,
    limit: DEFAULT_LIMIT,
    search: sp.get("q") || undefined,
    categoryId: sp.get("category") || undefined,
    brandId: sp.get("brand") || undefined,
    partType: sp.get("type") || undefined,
    isActive:
      status === "active" ? true : status === "inactive" ? false : undefined,
    isInStock: stock === "in" ? true : stock === "out" ? false : undefined,
  };
}

function toQueryString(params: PartsListParams): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("q", params.search);
  if (params.categoryId) sp.set("category", params.categoryId);
  if (params.brandId) sp.set("brand", params.brandId);
  if (params.partType) sp.set("type", params.partType);
  if (params.isActive === true) sp.set("status", "active");
  else if (params.isActive === false) sp.set("status", "inactive");
  if (params.isInStock === true) sp.set("stock", "in");
  else if (params.isInStock === false) sp.set("stock", "out");
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp.toString();
}

export function usePartFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => parseParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // Search box controlled locally (instant typing), mirrored to the URL on a
  // debounce. `synced` records the last URL value so an external change
  // (back/forward, reset) is reconciled during render — no setState-in-effect.
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
    (next: PartsListParams, mode: "push" | "replace") => {
      const qs = toQueryString(next);
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [pathname, router],
  );

  const setFilter = useCallback(
    (patch: Partial<PartsListParams>) =>
      commit({ ...params, ...patch, page: 1 }, "push"),
    [commit, params],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchBox((s) => ({ ...s, value }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        commit({ ...params, search: value || undefined, page: 1 }, "replace");
      }, SEARCH_DEBOUNCE_MS);
    },
    [commit, params],
  );

  const setPage = useCallback(
    (page: number) => commit({ ...params, page }, "push"),
    [commit, params],
  );

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return { params, searchInput, setFilter, setSearch, setPage, reset };
}
