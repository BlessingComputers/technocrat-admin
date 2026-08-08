"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ProductsListParams } from "../types/products";

/**
 * URL-state for the product browse view (`/catalogues/all`). Per ADR-0005, filter,
 * sort, and pagination state live in the URL — deep-linkable, reload-safe, and
 * back/forward-aware — not in local state or a store.
 *
 * History policy (see ADR-0010 handoff): the search box updates the URL with
 * `replace` (debounced) so typing doesn't spam history; every other change
 * (filter, sort, page) uses `push` so Back steps through deliberate actions.
 * Any change except `setPage` resets to page 1.
 */
const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_LIMIT = 20;
const DEFAULT_SORT_KEY = "newest";
const DEFAULT_SORT_DIR: "asc" | "desc" = "desc";

type Tab = NonNullable<ProductsListParams["tab"]>;
type SortDir = "asc" | "desc";

function toInt(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse the URL query into resolved list params (defaults applied). */
function parseParams(sp: URLSearchParams): ProductsListParams {
  const tab = sp.get("tab") as Tab | null;
  const stock = sp.get("stock") as ProductsListParams["stock"] | null;
  const dir = sp.get("dir");

  return {
    page: toInt(sp.get("page")) ?? 1,
    limit: DEFAULT_LIMIT,
    search: sp.get("search") || undefined,
    category: sp.get("category") || undefined,
    brand: sp.get("brand") || undefined,
    stock: stock || undefined,
    tab: tab && tab !== "all" ? tab : undefined,
    condition: sp.get("condition") || undefined,
    minPrice: toInt(sp.get("minPrice")),
    maxPrice: toInt(sp.get("maxPrice")),
    isFeatured: sp.get("featured") === "1" ? true : undefined,
    sortKey: sp.get("sort") || DEFAULT_SORT_KEY,
    sortDir: dir === "asc" || dir === "desc" ? dir : DEFAULT_SORT_DIR,
  };
}

/** Serialize params back to a query string, omitting defaults for clean URLs. */
function toQueryString(params: ProductsListParams): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  if (params.brand) sp.set("brand", params.brand);
  if (params.stock) sp.set("stock", params.stock);
  if (params.tab && params.tab !== "all") sp.set("tab", params.tab);
  if (params.condition) sp.set("condition", params.condition);
  if (params.minPrice != null) sp.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) sp.set("maxPrice", String(params.maxPrice));
  if (params.isFeatured) sp.set("featured", "1");
  if (params.sortKey && params.sortKey !== DEFAULT_SORT_KEY)
    sp.set("sort", params.sortKey);
  if (params.sortDir && params.sortDir !== DEFAULT_SORT_DIR)
    sp.set("dir", params.sortDir);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp.toString();
}

export function useProductFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => parseParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // The search box is controlled locally so typing is instant; a debounced timer
  // mirrors it into the URL (replace). `synced` records the URL value the box was
  // last reconciled with, so an external URL change (back/forward, reset) is
  // picked up during render — the documented "adjust state when a prop changes"
  // pattern, which avoids a setState-in-effect.
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

  // Update the URL with the native History API (Next syncs `useSearchParams`
  // with pushState/replaceState). Unlike `router.push`, this does NOT trigger an
  // RSC navigation, so the URL — and the `params` this hook derives from it —
  // change *synchronously*. The list is client-fetched (TanStack Query keyed on
  // those params), so the fetch fires immediately instead of the navigation
  // blocking on a server round-trip until data is ready.
  const commit = useCallback(
    (next: ProductsListParams, mode: "push" | "replace") => {
      const qs = toQueryString(next);
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [pathname],
  );

  const setFilter = useCallback(
    (patch: Partial<ProductsListParams>) =>
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

  const setSort = useCallback(
    (key: string) => {
      const nextDir: SortDir =
        params.sortKey === key
          ? params.sortDir === "asc"
            ? "desc"
            : "asc"
          : "asc";
      commit({ ...params, sortKey: key, sortDir: nextDir, page: 1 }, "push");
    },
    [commit, params],
  );

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Let the URL change flow back through `params.search` → render-time
    // reconciliation clears the box (avoids a flash that restores old text).
    window.history.pushState(null, "", pathname);
  }, [pathname]);

  return { params, searchInput, setFilter, setSearch, setPage, setSort, reset };
}
