"use client";

import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { usePreorders, usePreorderCounts } from "../api/preorder.queries";
import { usePreorderFilters } from "../hooks/use-preorder-filters";
import { PreordersAccessGate } from "./preorders-access-gate";
import { PreordersStatusChips } from "./preorders-status-chips";
import { PreordersFilterBar } from "./preorders-filter-bar";
import { PreordersTable } from "./preorders-table";
import { PreordersPagination } from "./preorders-pagination";

/** Pre-orders queue (route `/preorders`). */
export default function PreorderListView() {
  return (
    <PreordersAccessGate>
      <PreorderQueue />
    </PreordersAccessGate>
  );
}

/**
 * Split from the exported view so none of the queue's queries mount for a
 * staff member who will only be shown the restricted state — otherwise the
 * six list/count requests fire and all six 403, filling the console with
 * failures nobody can act on.
 */
function PreorderQueue() {
  const { params, searchInput, setStatus, setSearch, setPage, reset } =
    usePreorderFilters();

  const { data, isLoading, refetch, isFetching } = usePreorders(params);
  const {
    counts,
    total,
    isLoading: isLoadingCounts,
    isFetching: isFetchingCounts,
    refetch: refetchCounts,
  } = usePreorderCounts();

  const preorders = data?.data ?? [];
  const isFiltered = !!(params.status || params.search);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pre-orders"
        description="Customer requests for stock we don't hold yet"
      >
        <RefreshButton
          onRefresh={() => {
            void refetch();
            refetchCounts();
          }}
          isRefreshing={isFetching || isFetchingCounts}
        />
      </PageHeader>

      <PreordersStatusChips
        active={params.status}
        counts={counts}
        total={total}
        isLoading={isLoadingCounts}
        onSelect={setStatus}
      />

      <PreordersFilterBar
        searchInput={searchInput}
        hasActiveFilters={isFiltered}
        onSearch={setSearch}
        onReset={reset}
      />

      <PreordersTable
        preorders={preorders}
        isLoading={isLoading}
        isFiltered={isFiltered}
      />

      {data && (
        <PreordersPagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
