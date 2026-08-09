"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import type { OrderItem } from "../../types/orders";

interface OrderItemsListProps {
  items: OrderItem[];
}

/** Line items for an order — shared by both the manual and gateway views. */
export function OrderItemsList({ items }: OrderItemsListProps) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Card className="p-8 sm:p-10 border bg-card">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-foreground flex items-center gap-3">
          <AppIcon icon="solar:box-linear" className="w-6 h-6 text-primary" />
          Items
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground tabular-nums">
          {itemCount} unit{itemCount === 1 ? "" : "s"} · {items.length} line
          {items.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Product
              </th>
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                SKU
              </th>
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                Qty
              </th>
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">
                Unit Price
              </th>
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-5 pr-4">
                  <p className="font-bold text-foreground text-sm">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {item.variantName}
                    </p>
                  )}
                </td>
                <td className="py-5 font-mono text-[10px] text-muted-foreground">
                  {item.sku || "—"}
                </td>
                <td className="py-5 text-center font-black text-foreground tabular-nums">
                  {item.quantity}
                </td>
                <td className="py-5 text-right font-semibold text-muted-foreground tabular-nums">
                  {formatPrice(item.unitPrice)}
                </td>
                <td className="py-5 text-right font-black text-foreground tabular-nums">
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
