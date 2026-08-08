"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppIcon } from "@/components/shared/app-icon";
import { ManualField } from "./manual-field";
import type { ManualInvoiceFormState } from "../../schemas/manual-invoice";

interface ManualPaymentFieldsProps {
  form: ManualInvoiceFormState;
  onChange: (patch: Partial<ManualInvoiceFormState>) => void;
  /** The authenticated admin's name — sent as `issuedBy` (not user-editable). */
  issuedByName: string;
}

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "POS", "Card", "Cheque"];
const SALE_CHANNELS = ["Walk in", "Phone", "WhatsApp", "Social Media", "Other"];

export function ManualPaymentFields({
  form,
  onChange,
  issuedByName,
}: ManualPaymentFieldsProps) {
  return (
    <section className="space-y-5">
      <h3 className="text-sm font-black text-foreground">Payment &amp; Audit</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Payment method <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.paymentMethod}
            onValueChange={(v) => onChange({ paymentMethod: v })}
          >
            <SelectTrigger className="h-11 w-full rounded-lg bg-muted/50 border-border font-bold">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ManualField
          label="Payment reference"
          optional
          placeholder="—"
          value={form.paymentReference}
          onChange={(v) => onChange({ paymentReference: v })}
        />

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Sales channel <span className="text-muted-foreground/60">(optional)</span>
          </Label>
          <Select
            value={form.saleChannel || undefined}
            onValueChange={(v) => onChange({ saleChannel: v })}
          >
            <SelectTrigger className="h-11 w-full rounded-lg bg-muted/50 border-border font-bold">
              <SelectValue placeholder="Walk in" />
            </SelectTrigger>
            <SelectContent>
              {SALE_CHANNELS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          Note
        </Label>
        <Textarea
          placeholder="write note"
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="min-h-[80px] rounded-lg bg-muted/50 border-border font-medium"
        />
      </div>

      {/* Issued by — set from the authenticated admin, shown read-only. */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          Invoice issued by
        </Label>
        <div className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 text-sm font-bold text-foreground">
          <AppIcon
            icon="solar:user-linear"
            className="h-4 w-4 text-muted-foreground"
          />
          {issuedByName || "Current admin"}
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Auto
          </span>
        </div>
      </div>
    </section>
  );
}
