"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { useOrderCustomer } from "../../api/orders.queries";
import type { OrderCustomerInfo } from "../../types/orders";
import { MetaLabel } from "@/components/shared/meta-label";

/**
 * "3 paid orders", from the customer record. Paid, because `totalOrders` only
 * counts an order once its payment is validated, so an ordinal ("3rd order")
 * would be wrong for an order still waiting on validation.
 */
function paidOrdersLabel(count?: number | null): string | null {
  if (count == null) return null;
  if (count === 0) return "No paid orders yet";
  return `${count} paid order${count === 1 ? "" : "s"}`;
}

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
  const paidOrders = paidOrdersLabel(useOrderCustomer(customer.id).data?.totalOrders);

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
          {paidOrders && (
            <p className="mt-2 text-xs text-background/90">{paidOrders}</p>
          )}
        </div>

        {/* The way to everything else about this customer (orders, invoices,
            addresses). Before this, staff copied the name and searched
            Customers. */}
        {customer.id && (
          <Link
            href={`/customers/${customer.id}`}
            className="flex items-center justify-between gap-2 rounded-md bg-background/10 px-3 py-2 text-xs font-semibold text-background transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/60"
          >
            Open customer page
            <AppIcon icon="solar:alt-arrow-right-linear" className="w-3.5 h-3.5" />
          </Link>
        )}

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
