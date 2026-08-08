"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { useRefundItems } from "../api/invoice.queries";
import type { InvoiceLineItem } from "../types/invoice";

interface RefundItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  items: InvoiceLineItem[];
}

const HEADERS = ["", "Product", "SKU", "Variant", "QTY", "Unit price", "Total"];

export function RefundItemsModal({
  open,
  onOpenChange,
  invoiceId,
  items,
}: RefundItemsModalProps) {
  const refund = useRefundItems();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function toggle(id: string, checked: boolean) {
    setSelected((s) => ({ ...s, [id]: checked }));
  }

  function qtyFor(item: InvoiceLineItem) {
    return quantities[item.id] ?? item.quantity;
  }

  function handleRefund() {
    const payload = items
      .filter((item) => selected[item.id])
      .map((item) => {
        const quantity = qtyFor(item);
        return {
          orderItemId: item.orderItemId ?? item.id,
          quantity,
          refundAmount: item.unitPrice * quantity,
        };
      });
    if (payload.length === 0) return;
    refund.mutate(
      { invoiceId, items: payload },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const hasSelection = Object.values(selected).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-dashed border-sky-400/70 bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Select items to refund
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border-2 border-dashed border-sky-400/50 p-4">
          <h4 className="text-sm font-bold text-foreground">Items</h4>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="bg-primary/[0.04]">
                  {HEADERS.map((header, i) => (
                    <th
                      key={i}
                      className="px-3 py-2.5 text-[12px] font-medium text-muted-foreground"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={!!selected[item.id]}
                        onCheckedChange={(c) => toggle(item.id, c === true)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
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
                    <td className="px-3 py-3 text-sm text-foreground">
                      {item.sku ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-sm text-foreground">
                      {item.variantName ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Select
                        value={String(qtyFor(item))}
                        onValueChange={(v) =>
                          setQuantities((q) => ({ ...q, [item.id]: Number(v) }))
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className="h-8 w-16 rounded-md border-border/60 text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: item.quantity },
                            (_, i) => i + 1,
                          ).map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-3 text-sm text-foreground tabular-nums">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-foreground tabular-nums">
                      {formatPrice(item.unitPrice * qtyFor(item))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleRefund}
            disabled={!hasSelection || refund.isPending}
            className="h-11 gap-2 rounded-lg px-8 font-medium"
          >
            <AppIcon icon="solar:add-circle-linear" className="h-4 w-4" />
            {refund.isPending ? "Processing..." : "Refund"}
            <AppIcon icon="solar:add-circle-linear" className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
