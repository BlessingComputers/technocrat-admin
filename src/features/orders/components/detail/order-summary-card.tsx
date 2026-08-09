"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";

import { OrderStatusBadge } from "../order-status-badge";
import type { OrderMoney } from "../../types/orders";
import { MetaLabel } from "@/components/shared/meta-label";

interface OrderSummaryCardProps {
  money: OrderMoney;
  paymentStatus: string;
  deliveryMethod: string;
}

/**
 * The order's financial summary — payment state, delivery method, and the full
 * money breakdown. Shared by both detail views so the totals read identically
 * whether the order was paid by gateway or by bank transfer. Rows that don't
 * apply (no discount, no tax) are omitted rather than shown as zero.
 */
export function OrderSummaryCard({
  money,
  paymentStatus,
  deliveryMethod,
}: OrderSummaryCardProps) {
  const isDispatch = deliveryMethod === "DISPATCH";
  return (
    <Card className="p-6 space-y-5">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <AppIcon icon="solar:bill-list-linear" className="w-4 h-4 text-primary-ink" />
        Order Summary
      </h3>

      <div className="space-y-3">
        <SummaryRow label="Payment">
          <OrderStatusBadge status={paymentStatus} variant="payment" />
        </SummaryRow>
        <SummaryRow label="Delivery">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <AppIcon
              icon={isDispatch ? "solar:delivery-linear" : "solar:shop-linear"}
              className="w-4 h-4 text-muted-foreground"
            />
            {isDispatch ? "Delivery" : "Pick-up"}
          </span>
        </SummaryRow>
      </div>

      <div className="border-t border-border/60 pt-4 space-y-2.5">
        <AmountRow label="Subtotal" value={money.subtotal} />
        {money.discount != null && money.discount > 0 && (
          <AmountRow label="Discount" value={-money.discount} tone="success" />
        )}
        {money.tax != null && money.tax > 0 && (
          <AmountRow label="Tax" value={money.tax} />
        )}
        <AmountRow label="Shipping" value={money.shipping} />
        <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-1">
          <MetaLabel>
            Total
          </MetaLabel>
          <span className="text-xl font-semibold tabular-nums tracking-tighter text-primary-ink">
            {formatPrice(money.total)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function AmountRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          tone === "success"
            ? "text-sm font-semibold tabular-nums text-success-ink"
            : "text-sm font-semibold tabular-nums text-foreground"
        }
      >
        {formatPrice(value)}
      </span>
    </div>
  );
}
