"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import type { OrderItem } from "../../types/orders";
import { MetaLabel, metaLabelVariants } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";

interface OrderItemsListProps {
  items: OrderItem[];
}

/** Line items for an order — shared by both the manual and gateway views. */
export function OrderItemsList({ items }: OrderItemsListProps) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Card className="p-8 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-3">
          <AppIcon icon="solar:box-linear" className="w-6 h-6 text-primary-ink" />
          Items
        </h3>
        <MetaLabel className="tabular-nums">
          {itemCount} unit{itemCount === 1 ? "" : "s"} · {items.length} line
          {items.length === 1 ? "" : "s"}
        </MetaLabel>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className={cn(metaLabelVariants(), "pb-4")}>
                Product
              </th>
              <th className={cn(metaLabelVariants(), "pb-4")}>
                SKU
              </th>
              <th className={cn(metaLabelVariants(), "pb-4 text-center")}>
                Qty
              </th>
              <th className={cn(metaLabelVariants(), "pb-4 text-right")}>
                Unit Price
              </th>
              <th className={cn(metaLabelVariants(), "pb-4 text-right")}>
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-5 pr-4">
                  <p className="font-semibold text-foreground text-sm">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground font-medium">
                      {item.variantName}
                    </p>
                  )}
                </td>
                <td className="py-5 font-mono text-xs text-muted-foreground">
                  {item.sku || "—"}
                </td>
                <td className="py-5 text-center font-semibold text-foreground tabular-nums">
                  {item.quantity}
                </td>
                <td className="py-5 text-right font-semibold text-muted-foreground tabular-nums">
                  {formatPrice(item.unitPrice)}
                </td>
                <td className="py-5 text-right font-semibold text-foreground tabular-nums">
                  {formatPrice(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
