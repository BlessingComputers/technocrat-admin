"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/components/layouts/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import {
  useInvoiceDashboard,
  useInvoices,
  useManualInvoices,
} from "../api/invoice.queries";
import { InvoiceDashboardKpis } from "./invoice-dashboard-kpis";
import { InvoiceTabs, type InvoiceTabValue } from "./invoice-tabs";
import { InvoiceFilterBar } from "./invoice-filter-bar";
import { InvoiceTable } from "./invoice-table";
import { InvoicePagination } from "./invoice-pagination";
import { ManualInvoiceTable } from "./manual/manual-invoice-table";
import { Card } from "@/components/ui/card";
import type {
  InvoiceListParams,
  InvoiceStatus,
  ManualInvoiceListParams,
  ManualInvoiceStatus,
} from "../types/invoice";

const LIMIT = 20;

/** Map the `?tab=` URL param to a tab value (defaults to All). */
function parseTab(value: string | null): InvoiceTabValue {
  switch (value?.toLowerCase()) {
    case "inhouse":
      return "INHOUSE";
    case "outsourced":
      return "OUTSOURCED";
    case "manual":
      return "MANUAL";
    default:
      return "ALL";
  }
}

/** Invoice list view (route `/invoices`). Screens 1, 3, 4, 10 + Manual. */
export function InvoiceView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = parseTab(searchParams.get("tab"));
  const isManual = tab === "MANUAL";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [page, setPage] = useState(1);

  const params: InvoiceListParams = {
    page,
    limit: LIMIT,
    invoiceType: tab === "ALL" || isManual ? "" : tab,
    status,
    search,
  };
  const manualParams: ManualInvoiceListParams = {
    page,
    limit: LIMIT,
    search,
    status: status as ManualInvoiceStatus | "",
  };

  const { data: dashboard, isLoading: dashboardLoading } =
    useInvoiceDashboard();
  const { data: response, isLoading } = useInvoices(params, !isManual);
  const { data: manualResponse, isLoading: manualLoading } = useManualInvoices(
    manualParams,
    isManual,
  );

  const invoices = response?.data ?? [];
  const manualInvoices = manualResponse?.data ?? [];
  const meta = isManual ? manualResponse?.meta : response?.meta;
  const listLoading = isManual ? manualLoading : isLoading;

  const rowCount = isManual ? manualInvoices.length : invoices.length;
  const hasFilters = !!search || !!status;
  const showControls = rowCount > 0 || hasFilters || listLoading;

  function handleTabChange(next: InvoiceTabValue) {
    const sp = new URLSearchParams(searchParams);
    if (next === "ALL") sp.delete("tab");
    else sp.set("tab", next.toLowerCase());
    router.replace(sp.toString() ? `${pathname}?${sp}` : pathname, {
      scroll: false,
    });
    setPage(1);
  }

  function resetTo(updater: () => void) {
    updater();
    setPage(1);
  }

  return (
    <PageContainer>
      <PageHeader title="Invoices" />

      <InvoiceDashboardKpis data={dashboard} isLoading={dashboardLoading} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <InvoiceTabs value={tab} onChange={handleTabChange} />
        <Button
          asChild
          className="h-10 rounded-lg bg-primary px-5 font-medium text-primary-foreground"
        >
          <Link href="/invoices/manual/new">
            <AppIcon icon="solar:add-circle-linear" className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {showControls && (
          <div className="p-6 pb-4">
            <InvoiceFilterBar
              search={search}
              onSearchChange={(v) => resetTo(() => setSearch(v))}
              status={status}
              onStatusChange={(v) => resetTo(() => setStatus(v))}
            />
          </div>
        )}

        {isManual ? (
          <ManualInvoiceTable
            invoices={manualInvoices}
            isLoading={manualLoading}
          />
        ) : (
          <InvoiceTable
            invoices={invoices}
            isLoading={isLoading}
            showRepresentative={tab === "OUTSOURCED"}
          />
        )}

        {meta && meta.total > 0 && (
          <div className="border-t border-border/50">
            <InvoicePagination
              page={page}
              limit={LIMIT}
              total={meta.total}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
