"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Button } from "@/components/ui/button";
import { useCoupons, useCouponCounts } from "../api/coupons.queries";
import { useCouponFilters } from "../hooks/use-coupon-filters";
import { CouponsAccessGate } from "./coupons-access-gate";
import { CouponsStatusChips } from "./coupons-status-chips";
import { CouponsFilterBar } from "./coupons-filter-bar";
import { CouponsTable } from "./coupons-table";
import { CouponsPagination } from "./coupons-pagination";

/** Coupons catalogue (route `/coupons`). */
export default function CouponsListView() {
  return (
    <CouponsAccessGate>
      <CouponsCatalogue />
    </CouponsAccessGate>
  );
}

/**
 * Split from the exported view so none of the queries mount for a staff member
 * who will only be shown the restricted state — otherwise the four list/count
 * requests fire and all four 403, filling the console with failures nobody can
 * act on.
 */
function CouponsCatalogue() {
  const { params, searchInput, setStatus, setSearch, setPage, reset } =
    useCouponFilters();

  const { data, isLoading, refetch, isFetching } = useCoupons(params);
  const {
    counts,
    total,
    isLoading: isLoadingCounts,
    isFetching: isFetchingCounts,
    refetch: refetchCounts,
  } = useCouponCounts();

  const coupons = data?.data ?? [];
  const isFiltered = !!(params.status || params.search);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coupons"
        description="Discount codes customers type at checkout"
      >
        <RefreshButton
          onRefresh={() => {
            void refetch();
            refetchCounts();
          }}
          isRefreshing={isFetching || isFetchingCounts}
        />
        <Button asChild>
          <Link href="/coupons/new" className="gap-2">
            <AppIcon icon="solar:add-circle-linear" className="size-4" />
            New coupon
          </Link>
        </Button>
      </PageHeader>

      <CouponsStatusChips
        active={params.status}
        counts={counts}
        total={total}
        isLoading={isLoadingCounts}
        onSelect={setStatus}
      />

      <CouponsFilterBar
        searchInput={searchInput}
        hasActiveFilters={isFiltered}
        onSearch={setSearch}
        onReset={reset}
      />

      <CouponsTable
        coupons={coupons}
        isLoading={isLoading}
        isFiltered={isFiltered}
      />

      {data && (
        <CouponsPagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
