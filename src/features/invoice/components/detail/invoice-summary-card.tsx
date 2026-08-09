"use client";

import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { InvoiceStatusBadge } from "../invoice-status-badge";
import { InvoiceTypeBadge } from "../invoice-type-badge";
import { formatInvoiceDate } from "../../utils/invoice-utils";
import type { Invoice } from "../../types/invoice";

interface InvoiceSummaryCardProps {
  invoice: Invoice;
}

export function InvoiceSummaryCard({ invoice }: InvoiceSummaryCardProps) {
  function copyId() {
    navigator.clipboard
      ?.writeText(invoice.invoiceId)
      .then(() => toast.success("Invoice number copied"))
      .catch(() => undefined);
  }

  return (
    <Card className="gap-0 border bg-card p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_auto_1fr] lg:gap-10">
        {/* Identity */}
        <div>
          <p className="text-sm text-muted-foreground">Invoice Number</p>
          <div className="mt-1.5 flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {invoice.invoiceId}
            </h2>
            <button
              type="button"
              onClick={copyId}
              aria-label="Copy invoice number"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <AppIcon icon="solar:copy-linear" className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <InvoiceTypeBadge type={invoice.invoiceType} />
            <InvoiceStatusBadge
              status={invoice.status}
              invoiceType={invoice.invoiceType}
            />
          </div>

          <dl className="mt-5 space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">Order ID:</dt>
              <dd className="font-medium text-foreground">
                {invoice.orderId ?? "—"}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">Date:</dt>
              <dd className="font-medium text-foreground">
                {formatInvoiceDate(invoice.createdAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Divider */}
        <div className="hidden w-px bg-border/70 lg:block" />

        {/* Totals */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground tabular-nums">
              {formatPrice(invoice.totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1.5">
              <InvoiceStatusBadge
                status={invoice.status}
                invoiceType={invoice.invoiceType}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
