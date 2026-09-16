"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CouponStatus, CouponsListParams } from "../types/coupons";

const DEFAULT_LIMIT = 20;

function toInt(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseParams(sp: URLSearchParams): CouponsListParams {
  return {
    page: toInt(sp.get("page")) ?? 1,
    limit: DEFAULT_LIMIT,
    search: sp.get("search") || undefined,
    status: (sp.get("status") as CouponStatus | null) ?? undefined,
  };
}

/** Serialize back to a query string, omitting defaults for clean URLs. */
function toQueryString(params: CouponsListParams): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp.toString();
}

/**
 * Filter state for the coupons catalogue, held in the URL (ADR-0005).
 *
 * Same shape as `use-preorder-filters` — a debounced search box reconciled at
 * render time rather than from an effect — and for the same reason: "the
 * active ones" is a view staff send each other, and state that lives only in a
 * component cannot be pasted into a chat.
 */
export function useCouponFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => parseParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // Controlled locally so typing is instant; a debounced timer mirrors it into
  // the URL. `synced` records the URL value the box was last reconciled with,
  // so back/forward and reset are picked up during render rather than from an
  // effect (the documented "adjust state when a prop changes" pattern).
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
    (next: CouponsListParams, mode: "push" | "replace") => {
      const qs = toQueryString(next);
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [pathname, router],
  );

  const setStatus = useCallback(
    (status: CouponStatus | undefined) =>
      commit({ ...params, status, page: 1 }, "push"),
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
    // reconciliation clears the box (avoids a flash of the old text).
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return { params, searchInput, setStatus, setSearch, setPage, reset };
}
