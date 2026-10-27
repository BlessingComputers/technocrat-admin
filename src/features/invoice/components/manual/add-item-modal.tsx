"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ManualLineItemDraft } from "../../schemas/manual-invoice";

interface AddItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: ManualLineItemDraft) => void;
}

const EMPTY = {
  productName: "",
  variantName: "",
  sku: "",
  quantity: "1",
  unitPrice: "",
};

export function AddItemModal({ isOpen, onOpenChange, onAdd }: AddItemModalProps) {
  // Remounted via a changing `key` in the parent, so the draft starts fresh.
  const [draft, setDraft] = useState(EMPTY);

  const update = (key: keyof typeof EMPTY, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number(draft.quantity);
    const unitPrice = Number(draft.unitPrice);

    if (!draft.productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Quantity must be a whole number greater than 0");
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      toast.error("Unit price must be greater than 0");
      return;
    }

    onAdd({
      productName: draft.productName.trim(),
      variantName: draft.variantName.trim(),
      sku: draft.sku.trim(),
      quantity,
      unitPrice,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-8">
        <DialogTitle className="text-xl font-semibold tracking-tight mb-6">
          Add item
        </DialogTitle>

        <form onSubmit={handleAdd} className="space-y-5">
          <Field label="Product name" required>
            <Input
              autoFocus
              placeholder="Enter product name"
              value={draft.productName}
              onChange={(e) => update("productName", e.target.value)}
              className="h-11 rounded-lg bg-muted/50 border-border font-semibold"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Variant">
              <Input
                placeholder="e.g. White"
                value={draft.variantName}
                onChange={(e) => update("variantName", e.target.value)}
                className="h-11 rounded-lg bg-muted/50 border-border font-semibold"
              />
            </Field>
            <Field label="SKU">
              <Input
                placeholder="e.g. AP2-USB-C"
                value={draft.sku}
                onChange={(e) => update("sku", e.target.value)}
                className="h-11 rounded-lg bg-muted/50 border-border font-semibold"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity" required>
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="1"
                value={draft.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                className="h-11 rounded-lg bg-muted/50 border-border font-semibold"
              />
            </Field>
            <Field label="Unit price" required>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Enter price"
                value={draft.unitPrice}
                onChange={(e) => update("unitPrice", e.target.value)}
                className="h-11 rounded-lg bg-muted/50 border-border font-semibold"
              />
            </Field>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              type="submit"
              className="h-11 rounded-lg bg-primary px-10 font-medium text-primary-foreground"
            >
              Add item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground ml-1">
        {label}
        {required && <span className="text-destructive-ink"> *</span>}
      </Label>
      {children}
    </div>
  );
}
