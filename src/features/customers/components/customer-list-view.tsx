"use client";

import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { useCustomers, useCustomerAnalytics } from "../api/customer.queries";
import { useCustomerFilters } from "../hooks/use-customer-filter";
import { CustomersStatsBar } from "./customers-stats-bar";
import { CustomersFilterBar } from "./customers-filter-bar";
import { CustomersTable } from "./customers-table";
import { CustomersPagination } from "./customers-pagination";

/** Customers list view (route `/customers`). */
export default function CustomersListView() {
  const { params, searchInput, setSearch, setFilter, setPage, reset } =
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

      <CustomersTable customers={customers} isLoading={isLoading} />

      {meta && (
        <CustomersPagination
          page={meta.page}
          totalPages={meta.totalPages}
          hasNextPage={meta.hasNextPage}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
