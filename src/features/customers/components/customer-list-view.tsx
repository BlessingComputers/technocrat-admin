"use client";

import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useCustomers, useCustomerAnalytics } from "../api/customer.queries";
import { useCustomerFilters } from "../hooks/use-customer-filter";
import { CustomersStatsBar } from "./customers-stats-bar";
import { CustomersFilterBar } from "./customers-filter-bar";
import { DataPagination } from "@/components/shared/data-pagination";
import { CustomersTable } from "./customers-table";
import { CustomersExportMenu } from "./customers-export-menu";

/** Customers list view (route `/customers`). */
export default function CustomersListView() {
  const { params, searchInput, setSearch, setFilter, setPage, setLimit, reset } =
    useCustomerFilters();

  const {
    data: analytics,
    refetch: refetchAnalytics,
    isFetching: isFetchingAnalytics,
  } = useCustomerAnalytics();

  const {
    data,
    isLoading,
    refetch: refetchCustomers,
    isFetching: isFetchingCustomers,
  } = useCustomers(params);

  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customer Management"
        description="Browse, search, and inspect customer accounts"
      >
        <CustomersExportMenu params={params} />
        <RefreshButton
          onRefresh={() => {
            refetchAnalytics();
            refetchCustomers();
          }}
          isRefreshing={isFetchingAnalytics || isFetchingCustomers}
        />
      </PageHeader>

      <CustomersStatsBar analytics={analytics} />

      <CustomersFilterBar
        params={params}
        searchInput={searchInput}
        onSearch={setSearch}
        onFilter={setFilter}
        onReset={reset}
      />

      <CustomersTable
        customers={customers}
        isLoading={isLoading}
        footer={
          meta && (
            <DataPagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
              noun="customers"
            />
          )
        }
      />
    </div>
  );
}
