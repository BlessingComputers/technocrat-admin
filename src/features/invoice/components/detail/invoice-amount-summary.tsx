"use client";

import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format";
import type { Invoice } from "../../types/invoice";

interface InvoiceAmountSummaryProps {
  invoice: Invoice;
}

export function InvoiceAmountSummary({ invoice }: InvoiceAmountSummaryProps) {
  const taxRate = invoice.taxRate ?? 0;

  return (
    <Card className="h-full gap-0 p-8">
      <h3 className="text-base font-semibold text-foreground">Amount Summary</h3>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Subtotal:</dt>
          <dd className="text-foreground tabular-nums">
            {formatPrice(invoice.subtotalAmount)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Discount:</dt>
          <dd className="text-foreground tabular-nums">
            {formatPrice(invoice.discountAmount)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Tax ({taxRate}%):</dt>
          <dd className="text-foreground tabular-nums">
            {formatPrice(invoice.taxAmount)}
          </dd>
        </div>
        <div className="flex items-center justify-between pt-3">
          <dt className="font-medium text-muted-foreground">Total Amount:</dt>
          <dd className="text-base font-semibold text-foreground tabular-nums">
            {formatPrice(invoice.totalAmount)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
