"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { OrderCustomerInfo } from "../../types/orders";
import { MetaLabel } from "@/components/shared/meta-label";

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

  // Inverted panel: `bg-foreground` flips with the theme, so it is near-black in
  // light mode and near-WHITE in dark. No hue role survives that — `-ink` and the
  // raw token are both light in dark mode (measured 1.8-2.6:1 on this panel, both
  // apps, both themes). Text here uses the background family only; the accent
  // survives as a tint fill, never as text. Do not "restore" -ink here.
  return (
    <Card className="p-6 bg-foreground text-background">
      <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-background">
        <AppIcon icon="solar:user-rounded-linear" className="w-4 h-4 text-background/80" />
        Customer
      </h3>

      <div className="space-y-4">
        <div>
          {name ? (
            <>
              <p className="text-lg font-semibold leading-tight">{name}</p>
              {customer.customerId && (
                <p className="text-xs font-mono text-background/90 font-semibold mt-1">
                  {customer.customerId}
                </p>
              )}
            </>
          ) : customer.customerId ? (
            // Gateway orders carry only an id — make it the hero rather than
            // showing an empty "unnamed" line.
            <>
              <MetaLabel tone="inverted" className="block">
                Customer ID
              </MetaLabel>
              <p className="text-base font-mono font-semibold text-background/90 leading-tight mt-1 break-all">
                {customer.customerId}
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold leading-tight text-background/60">
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
