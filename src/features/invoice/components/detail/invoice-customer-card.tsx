"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { customerName } from "../../utils/invoice-utils";
import type { Invoice } from "../../types/invoice";

interface InvoiceCustomerCardProps {
  invoice: Invoice;
}

function addressLines(invoice: Invoice): string[] {
  const a = invoice.billingAddress ?? invoice.customer?.address;
  if (!a) return [];
  const line1 = [a.addressLine1, a.addressLine2].filter(Boolean).join(", ");
  const line2 = [a.city].filter(Boolean).join(", ");
  const line3 = [a.state, a.country].filter(Boolean).join(", ");
  return [line1, line2, line3].filter(Boolean);
}

export function InvoiceCustomerCard({ invoice }: InvoiceCustomerCardProps) {
  const { customer } = invoice;
  const lines = addressLines(invoice);

  return (
    <Card className="gap-0 p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Customer Information
          </h3>
          <div className="mt-4 space-y-3 text-sm text-foreground">
            <div className="flex items-center gap-3">
              <AppIcon
                icon="solar:user-linear"
                className="h-4 w-4 shrink-0 text-muted-foreground"
              />
              {customerName(customer)}
            </div>
            {customer?.phone && (
              <div className="flex items-center gap-3">
                <AppIcon
                  icon="solar:phone-linear"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
                {customer.phone}
              </div>
            )}
            {customer?.email && (
              <div className="flex items-center gap-3">
                <AppIcon
                  icon="solar:letter-linear"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
                {customer.email}
              </div>
            )}
          </div>
        </div>

        <div className="hidden w-px bg-border/70 lg:block" />

        <div>
          <h3 className="text-base font-semibold text-foreground">
            Billing Address
          </h3>
          <div className="mt-4 space-y-1 text-sm leading-relaxed text-muted-foreground">
            {lines.length > 0 ? (
              lines.map((line, i) => <p key={i}>{line}</p>)
            ) : (
              <p>No billing address on file</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
