"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";

import {
  useOrderDetail,
  useConfirmPayment,
  useRejectPayment,
  useUpdateOrderStatus,
  useCancelOrder,
} from "../api/orders.queries";
import { Button } from "@/components/ui/button";

import { OrderDetailHeader } from "./detail/order-detail-header";
import { OrderCancelDialog } from "./detail/order-cancel-dialog";
import { OrderPaymentVerification } from "./detail/order-payment-verification";
import { OrderFulfillmentManager } from "./detail/order-fulfillment-manager";
import { OrderItemsList } from "./detail/order-items-list";
import { OrderAuditTrail } from "./detail/order-audit-trail";
import { OrderCustomerCard } from "./detail/order-customer-card";
import { OrderSummaryCard } from "./detail/order-summary-card";
import { OrderDeliveryCard } from "./detail/order-delivery-card";
import { OrderMetaCard } from "./detail/order-meta-card";
import { OrderDetailSkeleton } from "./orders-skeletons";
import type { OrderTimelineEntry } from "../types/orders";

interface OrderDetailViewProps {
  manualOrderId: string;
}

const NON_CANCELLABLE = [
  "COMPLETED",
  "CANCELLED",
  "DELIVERED",
  "OUT_FOR_DELIVERY",
];

/** Order detail view for a manual bank-transfer order (route `/orders/[id]`). */
export function OrderDetailView({ manualOrderId }: OrderDetailViewProps) {
  const { data: order, isLoading } = useOrderDetail(manualOrderId);
  const confirmMutation = useConfirmPayment();
  const rejectMutation = useRejectPayment();
  const statusMutation = useUpdateOrderStatus();
  const cancelMutation = useCancelOrder();

  if (isLoading) return <OrderDetailSkeleton />;
  if (!order) return <OrderNotFound />;

  const isCancellable = !NON_CANCELLABLE.includes(order.orderStatus);

  const timeline: OrderTimelineEntry[] = order.statusHistory.map((h) => ({
    id: h.id,
    status: h.orderStatus,
    note: h.note,
    createdAt: h.createdAt,
    actorName: h.changedBy
      ? `${h.changedBy.firstName} ${h.changedBy.lastName}`.trim()
      : null,
    actorId: h.changedBy?.staffId ?? null,
  }));

  return (
    <div className="space-y-8 pb-20">
      <OrderDetailHeader
        reference={order.manualOrderId}
        description={`Order from ${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim()}
        source="manual"
        status={order.orderStatus}
        statusLabel={order.orderStatus_label}
        actions={
          isCancellable ? (
            <OrderCancelDialog
              consequence="This will release held stock"
              isPending={cancelMutation.isPending}
              onConfirm={(reason, close) =>
                cancelMutation.mutate(
                  { manualOrderId, data: { reason } },
                  { onSuccess: close },
                )
              }
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <OrderPaymentVerification
            order={order}
            onConfirm={(amount, note) =>
              confirmMutation.mutate({
                manualOrderId,
                data: { confirmedAmountPaid: amount, note },
              })
            }
            onReject={(reason) =>
              rejectMutation.mutate({
                manualOrderId,
                data: { rejectionReason: reason },
              })
            }
            isConfirmPending={confirmMutation.isPending}
            isRejectPending={rejectMutation.isPending}
          />

          <OrderFulfillmentManager
            currentStatus={order.orderStatus}
            deliveryMethod={order.deliveryMethod}
            collectRider
            onSubmit={(status, data) =>
              statusMutation.mutate({
                manualOrderId,
                data: {
                  orderStatus: status,
                  note: data.note,
                  riderName: data.riderName,
                  riderPhone: data.riderPhone,
                },
              })
            }
            isPending={statusMutation.isPending}
          />

          <OrderItemsList items={order.items} />

          <OrderAuditTrail entries={timeline} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <OrderCustomerCard
            customer={{
              name: `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim(),
              customerId: order.customer?.customerId,
              email: order.customer?.email,
              phone: order.customer?.phone,
            }}
          />
          <OrderSummaryCard
            money={{
              subtotal: order.subtotalAmount,
              discount: order.discountAmount,
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

function OrderNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <AppIcon icon="solar:danger-circle-linear" className="w-16 h-16 text-destructive" />
      <h2 className="text-2xl font-black text-foreground">Order Not Found</h2>
      <p className="text-muted-foreground font-medium">
        The order you are looking for does not exist or has been deleted.
      </p>
      <Link href="/orders">
        <Button variant="outline" className="rounded-xl px-8 font-bold">
          Return to Orders
        </Button>
      </Link>
    </div>
  );
}
