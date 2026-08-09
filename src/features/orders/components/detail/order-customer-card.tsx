"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { OrderCustomerInfo } from "../../types/orders";

interface OrderCustomerCardProps {
  customer: OrderCustomerInfo;
}

/**
 * Dark "spotlight" customer card — the one place the operator confirms who the
 * order is for. Shared by both flows; it degrades gracefully when the gateway
 * order carries only a customer id (no name/email yet) rather than rendering a
 * wall of empty fields.
 */
export function OrderCustomerCard({ customer }: OrderCustomerCardProps) {
  const name = customer.name?.trim();
  const hasContact = Boolean(customer.email || customer.phone);

  return (
    <Card className="p-6 border bg-foreground text-background">
      <h3 className="text-sm font-black uppercase tracking-widest mb-5 flex items-center gap-2 text-background/70">
        <AppIcon icon="solar:user-rounded-linear" className="w-4 h-4 text-primary" />
        Customer
      </h3>

      <div className="space-y-4">
        <div>
          {name ? (
            <>
              <p className="text-lg font-black leading-tight">{name}</p>
              {customer.customerId && (
                <p className="text-xs font-mono text-primary/90 font-bold mt-1">
                  {customer.customerId}
                </p>
              )}
            </>
          ) : customer.customerId ? (
            // Gateway orders carry only an id — make it the hero rather than
            // showing an empty "unnamed" line.
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-background/40">
                Customer ID
              </p>
              <p className="text-base font-mono font-black text-primary/90 leading-tight mt-1 break-all">
                {customer.customerId}
              </p>
            </>
          ) : (
            <p className="text-lg font-black leading-tight text-background/60">
              Unknown customer
            </p>
          )}
        </div>

        {hasContact && (
          <div className="pt-4 border-t border-background/10 space-y-3">
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-3 text-xs text-background/70 hover:text-background transition-colors"
              >
                <AppIcon icon="solar:letter-linear" className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </a>
            )}
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-3 text-xs text-background/70 hover:text-background transition-colors"
              >
                <AppIcon icon="solar:phone-linear" className="w-3.5 h-3.5 shrink-0" />
                {customer.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
