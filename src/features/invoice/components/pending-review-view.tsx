"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import PageContainer from "@/components/layouts/page-container";
import { formatPrice } from "@/lib/utils/format";
import { usePendingReview } from "../api/invoice.queries";
import { InvoicePagination } from "./invoice-pagination";
import { InvoiceEmptyState } from "./invoice-empty-state";
import { InvoiceTableSkeleton } from "./invoice-skeletons";
import { customerName, formatInvoiceDate } from "../utils/invoice-utils";
import type { InvoiceListParams } from "../types/invoice";
import { Card } from "@/components/ui/card";

const LIMIT = 20;
const HEADERS = [
  "Invoice ID",
  "Invoice number",
  "Customer",
  "Date",
  "Amount",
  "Action",
];

/** Pending-review claim queue (route `/invoices/pending-review`). Screen 8. */
export function PendingReviewView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params: InvoiceListParams = { page, limit: LIMIT, search };
  const { data: response, isLoading } = usePendingReview(params);

  const invoices = response?.data ?? [];
  const meta = response?.meta;

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
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Pending Review
        </h1>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
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

        {isLoading ? (
          <InvoiceTableSkeleton />
        ) : invoices.length === 0 ? (
          <InvoiceEmptyState message="No invoices awaiting review" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="bg-primary/[0.04]">
                  {HEADERS.map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3.5 text-xs font-medium text-muted-foreground first:pl-8 last:pr-8 last:text-right"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    // Same undocumented payload as the main list: `id` may be
                    // absent, `invoiceId` is the row's real identity.
                    key={inv.invoiceId ?? inv.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-6 py-4 pl-8 text-sm font-medium text-foreground">
                      {inv.invoiceId}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {customerName(inv.customer)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {formatInvoiceDate(inv.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground tabular-nums">
                      {formatPrice(inv.totalAmount)}
                    </td>
                    <td className="px-6 py-4 pr-8 text-right">
                      <Button
                        asChild
                        variant="destructive"
                        size="sm"
                        className="rounded-md px-5 font-medium"
                      >
                        <Link href={`/invoices/${inv.invoiceId}`}>Review</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
