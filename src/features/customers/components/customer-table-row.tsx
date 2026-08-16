import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { CustomerStatusBadge } from "./customer-status-badge";
import { LoyaltyTierBadge } from "./loyalty-tier-badge";
import {
  formatDate,
  fullName,
  initials,
  toAmount,
} from "../utils/customer-utils";
import type { Customer } from "../types/customers";
import { MetaLabel } from "@/components/shared/meta-label";

interface CustomerTableRowProps {
  customer: Customer;
}

export function CustomerTableRow({ customer }: CustomerTableRowProps) {
  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Customer */}
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary-ink flex items-center justify-center text-xs font-semibold shrink-0">
            {initials(customer)}
          </div>
          <Link
            href={`/customers/${customer.id}`}
            className="flex flex-col min-w-0 transition-colors"
          >
            <p className="font-semibold text-foreground hover:text-primary-ink hover:text-underline text-sm tracking-tight truncate">
              {fullName(customer)}
            </p>
            <p className="text-xs text-muted-foreground font-medium truncate">
              {customer.email}
            </p>
          </Link>
        </div>
      </td>

      {/* Status */}
      <td className="px-8 py-5">
        <CustomerStatusBadge status={customer.status} />
      </td>

      {/* Loyalty */}
      <td className="px-8 py-5">
        <LoyaltyTierBadge tier={customer.loyaltyTier} />
      </td>

      {/* Orders */}
      <td className="px-8 py-5">
        <p className="font-semibold text-foreground text-sm tracking-tight">
          {customer.totalOrders ?? 0}
        </p>
        <MetaLabel className="block mt-0.5">
          Orders
        </MetaLabel>
      </td>

      {/* Lifetime value */}
      <td className="px-8 py-5">
        <p className="font-semibold text-foreground text-sm tracking-tighter">
          {formatPrice(toAmount(customer.totalSpent))}
        </p>
      </td>

      {/* Joined */}
      <td className="px-8 py-5">
        <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
          <AppIcon
            icon="solar:calendar-linear"
            className="w-3 h-3 text-muted-foreground/60"
          />
          {formatDate(customer.createdAt)}
        </p>
      </td>

      {/* Actions */}
      <td className="px-8 py-5 text-right">
        <Button
          asChild
          variant="ghost"
          className="rounded-md h-10 w-10 p-0 text-muted-foreground hover:text-primary-ink hover:bg-primary/5"
        >
          <Link href={`/customers/${customer.id}`}>
            <AppIcon icon="solar:eye-linear" className="w-4 h-4" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}
