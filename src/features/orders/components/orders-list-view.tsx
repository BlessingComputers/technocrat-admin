"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useAllOrders, useOrderKpis } from "../api/orders.queries";
import { OrdersStatsBar } from "./orders-stats-bar";
import { OrdersFilterBar } from "./orders-filter-bar";
import { OrdersTable } from "./orders-table";
import { OrdersPagination } from "./orders-pagination";
import type { AdminOrderListParams } from "../types/orders";

const DEFAULT_PARAMS: AdminOrderListParams = {
  page: 1,
  limit: 20,
  search: "",
  orderStatus: "",
  paymentStatus: "",
  sortBy: "newest",
  source: "all",
};

/**
 * Orders list view (route `/orders`). Unifies the two backend order flows —
 * `gateway` (main order module / online payment) and `manual` (legacy
 * bank-transfer) — into one list, differentiated by a Source column and filter.
 * Backed by the combined `GET /all-orders` endpoint (`useAllOrders`): the
 * backend does the merge, filtering, sorting, and pagination in one query.
 */
export function OrdersListView() {
  const [params, setParams] = useState<AdminOrderListParams>(DEFAULT_PARAMS);

  const {
    stats,
    refetch: refetchStats,
    isFetching: isFetchingStats,
  } = useOrderKpis();

  const {
    rows,
    meta,
    isLoading,
    isError,
    isFetching: isFetchingOrders,
    refetch: refetchOrders,
  } = useAllOrders(params);

  const page = meta?.page ?? params.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  // Filter/sort changes reset to page 1; page changes keep the rest of the
  // params. Both re-query the backend (no client-side processing anymore).
  const updateFilters = (next: AdminOrderListParams) =>
    setParams({ ...next, page: 1 });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Order Management"
        description="Review and fulfil orders across all payment channels"
      >
        <RefreshButton
          onRefresh={() => {
            refetchStats();
            refetchOrders();
          }}
          isRefreshing={isFetchingStats || isFetchingOrders}
        />
      </PageHeader>

      <OrdersStatsBar stats={stats} />

      <OrdersFilterBar params={params} onParamsChange={updateFilters} />

      <OrdersTable
        orders={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetchOrders()}
        sortBy={params.sortBy ?? "newest"}
        onSortChange={(sortBy) => setParams({ ...params, sortBy, page: 1 })}
      />

      {totalPages > 1 && (
        <OrdersPagination
          page={page}
          totalPages={totalPages}
          hasNextPage={meta?.hasNextPage ?? page < totalPages}
          onPageChange={(p) => setParams({ ...params, page: p })}
        />
      )}
    </div>
  );
}
