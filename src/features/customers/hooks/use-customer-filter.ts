"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  CustomersListParams,
  CustomerStatus,
  LoyaltyTier,
} from "../types/customers";

const DEFAULT_LIMIT = 20;

function toInt(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse the URL query into resolved list params (defaults applied). */
function parseParams(sp: URLSearchParams): CustomersListParams {
  return {
    page: toInt(sp.get("page")) ?? 1,
    limit: DEFAULT_LIMIT,
    search: sp.get("search") || undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
    loyaltyTier: sp.get("loyaltyTier") as LoyaltyTier | undefined,
    status: sp.get("status") as CustomerStatus | undefined,
  };
}

/** Serialize params back to a query string, omitting defaults for clean URLs. */
function toQueryString(params: CustomersListParams): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.loyaltyTier) sp.set("loyaltyTier", params.loyaltyTier);
  if (params.status) sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp.toString();
}

export function useCustomerFilters() {
  const router = useRouter();
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

  const commit = useCallback(
    (next: CustomersListParams, mode: "push" | "replace") => {
      const qs = toQueryString(next);
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [pathname, router],
  );

  const setFilter = useCallback(
    (patch: Partial<CustomersListParams>) =>
      commit({ ...params, ...patch, page: 1 }, "push"),
    [commit, params],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchBox((s) => ({ ...s, value }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        commit({ ...params, search: value || undefined, page: 1 }, "replace");
      }, 300);
    },
    [commit, params],
  );

  const setPage = useCallback(
    (page: number) => commit({ ...params, page }, "push"),
    [commit, params],
  );

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Let the URL change flow back through `params.search` → render-time
    // reconciliation clears the box (avoids a flash that restores old text).
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return { params, searchInput, setFilter, setSearch, setPage, reset };
}
