import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import {
  formatDate,
  invoiceStatusClasses,
  toAmount,
} from "../../utils/customer-utils";
import type { CustomerInvoiceSummary } from "../../types/customers";

interface CustomerInvoicesListProps {
  invoices: CustomerInvoiceSummary[];
  isLoading: boolean;
}

function invoiceRef(invoice: CustomerInvoiceSummary): string {
  return invoice.invoiceId || invoice.id;
}

export function CustomerInvoicesList({
  invoices,
  isLoading,
}: CustomerInvoicesListProps) {
  return (
    <Card className="p-8 border border-border bg-card rounded-xl">
      <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3">
        <AppIcon
          icon="solar:bill-list-linear"
          className="w-5 h-5 text-primary"
        />
        Invoice History
        {!isLoading && (
          <span className="ml-auto text-xs font-black text-muted-foreground">
            {invoices.length}
          </span>
        )}
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground font-medium py-8 text-center">
          This customer has no invoices yet.
        </p>
      ) : (
        <div className="divide-y divide-border/60">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoiceRef(invoice)}`}
              className="flex items-center justify-between gap-4 py-4 -mx-2 px-2 rounded-lg hover:bg-muted/40 transition-colors group"
            >
              <div className="min-w-0">
                <p className="font-black text-foreground text-sm tracking-tight truncate group-hover:text-primary transition-colors">
                  {invoice.invoiceNumber || invoiceRef(invoice)}
                </p>
                <p className="text-[11px] text-muted-foreground font-bold mt-0.5">
                  {formatDate(invoice.createdAt)}
                  {invoice.invoiceType && (
                    <span> · {invoice.invoiceType}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {invoice.status && (
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                      invoiceStatusClasses(invoice.status),
                    )}
                  >
                    {invoice.status.replace(/_/g, " ")}
                  </span>
                )}
                <p className="font-black text-foreground text-sm tracking-tighter w-24 text-right">
                  {formatPrice(toAmount(invoice.totalAmount))}
                </p>
                <AppIcon
                  icon="solar:alt-arrow-right-linear"
                  className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
