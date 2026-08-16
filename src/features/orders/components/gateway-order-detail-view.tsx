"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";

import {
  useGatewayOrderDetail,
  useGatewayOrderHistory,
  useUpdateGatewayStatus,
  useCancelGatewayOrder,
} from "../api/orders.queries";
import { OrderDetailHeader } from "./detail/order-detail-header";
import { OrderCancelDialog } from "./detail/order-cancel-dialog";
import { OrderFulfillmentManager } from "./detail/order-fulfillment-manager";
import { OrderItemsList } from "./detail/order-items-list";
import { OrderAuditTrail } from "./detail/order-audit-trail";
import { OrderCustomerCard } from "./detail/order-customer-card";
import { OrderSummaryCard } from "./detail/order-summary-card";
import { OrderDeliveryCard } from "./detail/order-delivery-card";
import { OrderMetaCard } from "./detail/order-meta-card";
import { OrderDetailSkeleton } from "./orders-skeletons";
import type { OrderItem, OrderTimelineEntry } from "../types/orders";

const TERMINAL = ["COMPLETED", "CANCELLED", "REFUNDED", "DELIVERED"];

interface GatewayOrderDetailViewProps {
  orderId: string;
}

/** Detail view for a main-order-module (gateway) order (route `/orders/gateway/[id]`). */
export function GatewayOrderDetailView({
  orderId,
}: GatewayOrderDetailViewProps) {
  const { data: order, isLoading } = useGatewayOrderDetail(orderId);
  const { data: history } = useGatewayOrderHistory(orderId);
  const statusMutation = useUpdateGatewayStatus();
  const cancelMutation = useCancelGatewayOrder();

  if (isLoading) return <OrderDetailSkeleton />;
  if (!order) return <GatewayOrderNotFound />;

  const isCancellable = !TERMINAL.includes(order.orderStatus);

  const itemsForList: OrderItem[] = order.items.map((i) => ({
    id: i.id,
    variantId: i.variantId ?? "",
    productName: i.productName,
    variantName: i.variantName,
    sku: i.sku,
    imageUrl: i.imageUrl ?? "",
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.totalPrice,
  }));

  const timeline: OrderTimelineEntry[] = (history ?? []).map((h) => ({
    id: h.id,
    status: h.status,
    note: h.notes,
    createdAt: h.createdAt,
    actorName: null,
    actorId: h.staffId ?? null,
  }));

  return (
    <div className="space-y-8 pb-20">
      <OrderDetailHeader
        reference={order.orderNumber}
        description="Online gateway payment"
        source="gateway"
        status={order.orderStatus}
        actions={
          isCancellable ? (
            <OrderCancelDialog
              isPending={cancelMutation.isPending}
              onConfirm={(reason, close) =>
                cancelMutation.mutate(
                  { orderId, data: { reason } },
                  { onSuccess: close },
                )
              }
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <OrderFulfillmentManager
            currentStatus={order.orderStatus}
            deliveryMethod={order.deliveryMethod}
            onSubmit={(status, data) =>
              statusMutation.mutate({
                orderId,
                data: { status, notes: data.note || undefined },
              })
            }
            isPending={statusMutation.isPending}
          />

          <OrderItemsList items={itemsForList} />

          <OrderAuditTrail entries={timeline} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <OrderCustomerCard customer={{ customerId: order.customerId }} />
          <OrderSummaryCard
            money={{
              subtotal: order.subtotalAmount,
              discount: order.discountAmount,
              tax: order.taxAmount,
              shipping: order.shippingCost,
              total: order.totalAmount,
            }}
            paymentStatus={order.paymentStatus}
            deliveryMethod={order.deliveryMethod}
          />
          <OrderDeliveryCard
            deliveryMethod={order.deliveryMethod}
            shippingAddress={order.shippingAddress}
            notes={order.notes}
            riderName={order.riderName}
            riderPhone={order.riderPhone}
          />
          <OrderMetaCard
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
            completedAt={order.completedAt}
            cancelledAt={order.cancelledAt}
          />
        </div>
      </div>
    </div>
  );
}

function GatewayOrderNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <AppIcon
        icon="solar:danger-circle-linear"
        className="w-16 h-16 text-destructive-ink"
      />
      <h2 className="text-2xl font-semibold text-foreground">Order Not Found</h2>
      <p className="text-muted-foreground font-medium">
        This gateway order does not exist or could not be loaded.
      </p>
      <Link href="/orders">
        <Button variant="outline" className="rounded-xl px-8 font-medium">
          Return to Orders
        </Button>
      </Link>
    </div>
  );
}
