"use client";

import { useRouter } from "next/navigation";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { InvoiceTypeBadge } from "./invoice-type-badge";
import { InvoiceEmptyState } from "./invoice-empty-state";
import { InvoiceTableSkeleton } from "./invoice-skeletons";
import { customerName, formatInvoiceDate } from "../utils/invoice-utils";
import type { InvoiceListItem } from "../types/invoice";

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
  isLoading: boolean;
  /** Show the Representative column (with reassign affordance) instead of Type. */
  showRepresentative?: boolean;
  showStatus?: boolean;
  emptyMessage?: string;
}

export function InvoiceTable({
  invoices,
  isLoading,
  showRepresentative = false,
  showStatus = true,
  emptyMessage,
}: InvoiceTableProps) {
  const router = useRouter();

  const headers = [
    "Invoice ID",
    "Invoice number",
    "Customer",
    showRepresentative ? "Representative" : "Type",
    "Date",
    "Amount",
    ...(showStatus ? ["Status"] : []),
  ];

  if (isLoading) {
    return <InvoiceTableSkeleton />;
  }

  if (invoices.length === 0) {
    return <InvoiceEmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left">
        <thead>
          <tr className="bg-primary/[0.04]">
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-3.5 text-xs font-medium text-muted-foreground first:pl-8"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr
              // `id` is absent from this undocumented payload; `invoiceId` is
              // the row's real identity (route param + first column).
              key={inv.invoiceId ?? inv.id}
              onClick={() => router.push(`/invoices/${inv.invoiceId}`)}
              className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
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
              <td className="px-6 py-4">
                {showRepresentative ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                    {inv.representative
                      ? `${inv.representative.firstName} ${inv.representative.lastName}`
                      : "Unassigned"}
                    <AppIcon
                      icon="solar:alt-arrow-down-linear"
                      className="h-3.5 w-3.5 text-muted-foreground"
                    />
                  </span>
                ) : (
                  <InvoiceTypeBadge type={inv.invoiceType} />
                )}
              </td>
              <td className="px-6 py-4 text-sm text-foreground">
                {formatInvoiceDate(inv.createdAt)}
              </td>
              <td
                className={cn(
                  "px-6 py-4 text-sm font-medium text-foreground tabular-nums",
                  !showStatus && "pr-8",
                )}
              >
                {formatPrice(inv.totalAmount)}
              </td>
              {showStatus && (
                <td className="px-6 py-4 pr-8">
                  <InvoiceStatusBadge
                    status={inv.status}
                    invoiceType={inv.invoiceType}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
