"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderSourceBadge } from "./order-source-badge";
import type { AdminOrderRow } from "../types/orders";

interface OrderTableRowProps {
  order: AdminOrderRow;
}

export function OrderTableRow({ order }: OrderTableRowProps) {
  const router = useRouter();
  const href = order.detailHref;

  function handleRowClick(e: React.MouseEvent<HTMLTableRowElement>) {
    // Don't hijack a text selection (staff copy emails / IDs) or clicks on an
    // interactive child — links and buttons handle their own navigation.
    if (window.getSelection()?.toString()) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    router.push(href);
  }

  return (
    <tr
      onClick={handleRowClick}
      className="group cursor-pointer hover:bg-muted/30 transition-colors"
    >
      {/* Order ID & Date */}
      <td className="px-8 py-5">
        <div className="flex flex-col gap-0.5">
          <Link
            href={href}
            className="w-fit rounded-sm text-sm font-semibold tabular-nums text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {order.reference}
          </Link>
          <p className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
            <AppIcon
              icon="solar:calendar-linear"
              className="w-3 h-3 text-muted-foreground/60"
            />
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>
      </td>

      {/* Source */}
      <td className="px-8 py-5">
        <OrderSourceBadge source={order.source} />
      </td>

      {/* Customer Details */}
      <td className="px-8 py-5">
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-foreground text-sm">
            {order.customerName ??
              (order.customerId
                ? `Customer ${order.customerId.slice(0, 8)}`
                : "Guest Customer")}
          </p>
          {order.customerEmail ? (
            <p className="text-xs text-muted-foreground">
              {order.customerEmail}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">
              No customer details on list
            </p>
          )}
          {order.customerPhone && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {order.customerPhone}
            </p>
          )}
        </div>
      </td>

      {/* Products Ordered */}
      <td className="px-8 py-5 max-w-xs">
        {order.itemCount > 0 ? (
          <div className="space-y-1.5">
            <p className="text-sm text-foreground font-medium line-clamp-1">
              {order.firstItemName}
            </p>
            {order.itemCount > 1 && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                +{order.itemCount - 1} more
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic">No items</span>
        )}
      </td>

      {/* Order Status */}
      <td className="px-8 py-5">
        <OrderStatusBadge status={order.orderStatus} variant="order" />
      </td>

      {/* Payment Status */}
      <td className="px-8 py-5">
        <OrderStatusBadge status={order.paymentStatus} variant="payment" />
      </td>

      {/* Total Amount */}
      <td className="px-8 py-5">
        <p className="font-semibold text-foreground text-sm tabular-nums">
          {formatPrice(order.totalAmount)}
        </p>
        {order.itemCount > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
            {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
          </p>
        )}
      </td>

      {/* Delivery Method */}
      <td className="px-8 py-5">
        <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
          <AppIcon
            icon={
              order.deliveryMethod === "DISPATCH"
                ? "solar:delivery-linear"
                : "solar:shop-linear"
            }
            className={cn("w-3 h-3")}
          />
          {order.deliveryMethod === "DISPATCH" ? "Delivery" : "Pick-up"}
        </div>
      </td>

      {/* Actions */}
      <td className="px-8 py-5 text-right">
        <Button
          asChild
          variant="ghost"
          className="rounded-md h-10 w-10 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
        >
          <Link href={href} aria-label={`View order ${order.reference}`}>
            <AppIcon icon="solar:eye-linear" className="w-4 h-4" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}
