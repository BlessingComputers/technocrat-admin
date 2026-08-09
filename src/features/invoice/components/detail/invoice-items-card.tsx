"use client";

/* eslint-disable @next/next/no-img-element */
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import type { InvoiceLineItem } from "../../types/invoice";

interface InvoiceItemsCardProps {
  items: InvoiceLineItem[];
}

const HEADERS = ["Product", "SKU", "Variant", "QTY", "Unit price", "Total"];

export function InvoiceItemsCard({ items }: InvoiceItemsCardProps) {
  return (
    <Card className="gap-0 border bg-card p-8">
      <h3 className="text-base font-bold text-foreground">Items</h3>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="bg-primary/[0.04]">
              {HEADERS.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-xs font-medium text-muted-foreground first:rounded-l-lg first:pl-4 last:rounded-r-lg"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <AppIcon
                            icon="solar:box-linear"
                            className="h-4 w-4 text-muted-foreground/50"
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {item.productName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-foreground">
                  {item.sku ?? "—"}
                </td>
                <td className="px-4 py-4 text-sm text-foreground">
                  {item.variantName ?? "—"}
                </td>
                <td className="px-4 py-4 text-sm text-foreground tabular-nums">
                  {item.quantity}
                </td>
                <td className="px-4 py-4 text-sm text-foreground tabular-nums">
                  {formatPrice(item.unitPrice)}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-foreground tabular-nums">
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
