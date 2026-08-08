"use client";

import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import type { ManualLineItemDraft } from "../../schemas/manual-invoice";

interface ManualItemsTableProps {
  items: ManualLineItemDraft[];
  onAddClick: () => void;
  onRemove: (index: number) => void;
}

const HEADERS = ["Product", "SKU", "Variant", "QTY", "Unit price", "Total", ""];

export function ManualItemsTable({
  items,
  onAddClick,
  onRemove,
}: ManualItemsTableProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground">Items Purchased</h3>
        <Button
          type="button"
          onClick={onAddClick}
          className="h-9 rounded-lg bg-primary px-4 font-black text-primary-foreground"
        >
          <AppIcon icon="solar:add-circle-linear" className="mr-2 h-4 w-4" />
          Add Items
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-primary/[0.04]">
              {HEADERS.map((h, i) => (
                <th
                  key={h || i}
                  className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={HEADERS.length}
                  className="px-4 py-8 text-center text-sm font-medium text-muted-foreground"
                >
                  No items yet — click “Add Items” to add one.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index} className="text-sm">
                  <td className="px-4 py-3 font-bold text-foreground">
                    <span
                      className="block max-w-[200px] truncate"
                      title={item.productName}
                    >
                      {item.productName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.sku || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.variantName || "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {formatPrice(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 font-black text-foreground">
                    {formatPrice(item.quantity * item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="text-destructive/70 transition-colors hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <AppIcon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
