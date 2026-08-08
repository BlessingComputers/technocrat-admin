import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { formatDate, toAmount } from "../../utils/customer-utils";
import type { CustomerOrderSummary } from "../../types/customers";

interface CustomerOrdersListProps {
  orders: CustomerOrderSummary[];
  isLoading: boolean;
}

function orderTone(status?: string): string {
  const s = status?.toUpperCase() ?? "";
  if (s === "COMPLETED" || s === "DELIVERED" || s === "PAYMENT_CONFIRMED") {
    return "bg-success/15 text-success";
  }
  if (s.includes("CANCEL") || s.includes("REJECT")) {
    return "bg-destructive/12 text-destructive";
  }
  if (s === "PENDING" || s === "AWAITING_PAYMENT" || s === "PROOF_SUBMITTED") {
    return "bg-warning/15 text-warning";
  }
  return "bg-muted text-muted-foreground";
}

function orderRef(order: CustomerOrderSummary): string {
  return order.manualOrderId || order.orderId || order.id;
}

export function CustomerOrdersList({
  orders,
  isLoading,
}: CustomerOrdersListProps) {
  return (
    <Card className="p-8 border border-border bg-card rounded-xl">
      <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3">
        <AppIcon icon="solar:bag-4-linear" className="w-5 h-5 text-primary" />
        Order History
        {!isLoading && (
          <span className="ml-auto text-xs font-black text-muted-foreground">
            {orders.length}
          </span>
        )}
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground font-medium py-8 text-center">
          This customer has no orders yet.
        </p>
      ) : (
        <div className="divide-y divide-border/60">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${orderRef(order)}`}
              className="flex items-center justify-between gap-4 py-4 -mx-2 px-2 rounded-lg hover:bg-muted/40 transition-colors group"
            >
              <div className="min-w-0">
                <p className="font-black text-foreground text-sm tracking-tight truncate group-hover:text-primary transition-colors">
                  {orderRef(order)}
                </p>
                <p className="text-[11px] text-muted-foreground font-bold mt-0.5">
                  {formatDate(order.createdAt)}
                  {order.items && order.items.length > 0 && (
                    <span> · {order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {order.orderStatus && (
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      orderTone(order.orderStatus),
                    )}
                  >
                    {order.orderStatus.replace(/_/g, " ")}
                  </span>
                )}
                <p className="font-black text-foreground text-sm tracking-tighter w-24 text-right">
                  {formatPrice(toAmount(order.totalAmount))}
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
