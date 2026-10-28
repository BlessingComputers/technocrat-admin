"use client";

import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { InvoiceTableSkeleton } from "../invoice-skeletons";
import { InvoiceEmptyState } from "../invoice-empty-state";
import { formatInvoiceDate, invoiceStatusMeta } from "../../utils/invoice-utils";
import type {
  InvoiceStatus,
  ManualInvoiceListItem,
} from "../../types/invoice";

interface ManualInvoiceTableProps {
  invoices: ManualInvoiceListItem[];
  isLoading: boolean;
}

const HEADERS = [
  "Invoice ID",
  "Invoice number",
  "Customer",
  "Type",
  "Date",
  "Amount",
  "Status",
];

export function ManualInvoiceTable({
  invoices,
  isLoading,
}: ManualInvoiceTableProps) {
  const router = useRouter();

  if (isLoading) return <InvoiceTableSkeleton />;
  if (invoices.length === 0) {
    return <InvoiceEmptyState message="No manual invoices yet" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left">
        <thead>
          <tr className="bg-primary/[0.04]">
            {HEADERS.map((header) => (
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
          {invoices.map((inv) => {
            const meta = invoiceStatusMeta(inv.status as InvoiceStatus);
            return (
              <tr
                key={inv.manualInvoiceId}
                onClick={() =>
                  router.push(`/invoices/manual/${inv.manualInvoiceId}`)
                }
                className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="px-6 py-4 pl-8 text-sm font-medium text-foreground">
                  {inv.manualInvoiceId}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {inv.invoiceNumber}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {inv.customerName || "—"}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-ink">
                    Manual
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {formatInvoiceDate(inv.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-foreground tabular-nums">
                  {formatPrice(inv.totalAmount)}
                </td>
                <td className="px-6 py-4 pr-8">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap",
                      meta.className,
                    )}
                  >
                    {meta.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
