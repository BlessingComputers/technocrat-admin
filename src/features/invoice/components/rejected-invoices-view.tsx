"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/shared/app-icon";
import PageContainer from "@/components/layouts/page-container";
import { formatPrice } from "@/lib/utils/format";
import { useRejectedInvoices } from "../api/invoice.queries";
import { StatsBar } from "@/components/shared/stats-bar";
import { InvoiceKpiCard } from "./kpis/invoice-kpi-card";
import { InvoiceTable } from "./invoice-table";
import { InvoicePagination } from "./invoice-pagination";
import type { InvoiceListParams } from "../types/invoice";

const LIMIT = 20;

/** Rejected & partially-approved invoices (route `/invoices/rejected`). Screen 9. */
export function RejectedInvoicesView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params: InvoiceListParams = { page, limit: LIMIT, search };
  const { data: response, isLoading } = useRejectedInvoices(params);

  const invoices = response?.data ?? [];
  const meta = response?.meta;
  const summary = response?.summary;

  return (
    <PageContainer className="pb-16">
      <div className="space-y-1">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <AppIcon icon="solar:arrow-left-linear" className="h-4 w-4" />
          Back
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Rejected invoices
        </h1>
      </div>

      <StatsBar columns={3}>
        <InvoiceKpiCard
          title="Total amount"
          value={formatPrice(summary?.totalAmount ?? 0)}
          icon="solar:bill-list-linear"
          tone="primary"
          isLoading={isLoading}
        />
        <InvoiceKpiCard
          title="Refunded"
          value={formatPrice(summary?.refundedAmount ?? 0)}
          icon="solar:bill-check-linear"
          tone="success"
          isLoading={isLoading}
        />
        <InvoiceKpiCard
          title="Pending refund"
          value={formatPrice(summary?.pendingRefundAmount ?? 0)}
          icon="solar:bill-list-linear"
          tone="warning"
          isLoading={isLoading}
        />
      </StatsBar>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="p-6 pb-4">
          <div className="relative">
            <AppIcon
              icon="solar:magnifer-linear"
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search invoice"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border-border/60 bg-muted/40 pl-10 text-sm font-medium"
            />
          </div>
        </div>

        <InvoiceTable
          invoices={invoices}
          isLoading={isLoading}
          showRepresentative
          showStatus={false}
          emptyMessage="No rejected invoices"
        />

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
      </div>
    </PageContainer>
  );
}
