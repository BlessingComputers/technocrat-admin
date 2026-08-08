"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useTransactions } from "../api/payments.queries";
import { PaymentsAccessGate } from "./payments-access-gate";
import { PaymentsNavTabs } from "./payments-nav-tabs";
import { PaymentsFilterBar } from "./payments-filter-bar";
import { PaymentsTable } from "./payments-table";
import { PaymentsPagination } from "./payments-pagination";
import type { AdminTransactionListParams } from "../types/payments";

const DEFAULT_PARAMS: AdminTransactionListParams = {
  page: 1,
  limit: 20,
  search: "",
  status: "",
};

/**
 * Payments list (route `/payments`) — the transaction list from
 * `GET /admin/transactions` (PAYMENTS-BACKEND-CONTRACT.md §3). SUPER_ADMIN
 * only, both by backend enforcement and by `PaymentsAccessGate` here.
 */
export function PaymentsListView() {
  const [params, setParams] = useState<AdminTransactionListParams>(
    DEFAULT_PARAMS,
  );

  const { rows, meta, isLoading, isError, isFetching, refetch } =
    useTransactions(params);

  const updateFilters = (next: AdminTransactionListParams) =>
    setParams({ ...next, page: 1 });

  return (
    <PaymentsAccessGate>
      <div className="space-y-8">
        <PageHeader
          title="Payments"
          description="Every gateway transaction — search, filter, and open the DLQ or webhook tools when one gets stuck"
        >
          <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        </PageHeader>

        <PaymentsNavTabs />

        <PaymentsFilterBar params={params} onParamsChange={updateFilters} />

        <PaymentsTable
          payments={rows}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
        />

        {meta && meta.totalPages > 1 && (
          <PaymentsPagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(p) => setParams({ ...params, page: p })}
          />
        )}
      </div>
    </PaymentsAccessGate>
  );
}
