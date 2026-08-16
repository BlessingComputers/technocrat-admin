"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils/format";
import { ManualField } from "./manual-field";
import {
  computeManualInvoiceTotals,
  type ManualInvoiceFormState,
} from "../../schemas/manual-invoice";

interface ManualChargesSummaryProps {
  form: ManualInvoiceFormState;
  onChange: (patch: Partial<ManualInvoiceFormState>) => void;
}

const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];

export function ManualChargesSummary({
  form,
  onChange,
}: ManualChargesSummaryProps) {
  const totals = computeManualInvoiceTotals(form);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Charges & Currency */}
      <div className="space-y-4 rounded-lg bg-muted/30 p-5">
        <h4 className="text-sm font-semibold text-foreground">Charges &amp; Currency</h4>
        <div className="grid grid-cols-2 gap-4">
          <ManualField
            label="Tax %"
            optional
            type="number"
            placeholder="0.00"
            value={form.taxRate}
            onChange={(v) => onChange({ taxRate: v })}
          />
          <ManualField
            label="Shipping cost"
            type="number"
            placeholder="0.00"
            value={form.shippingCost}
            onChange={(v) => onChange({ shippingCost: v })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground ml-1">
            Currency
          </Label>
          <Select
            value={form.currency}
            onValueChange={(v) => onChange({ currency: v })}
          >
            <SelectTrigger className="h-11 w-full rounded-lg bg-card border-border font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Amount Summary */}
      <div className="space-y-3 rounded-lg bg-muted/30 p-5">
        <h4 className="text-sm font-semibold text-foreground">Amount Summary</h4>
        <SummaryRow label="Subtotal" value={formatPrice(totals.subtotal)} />
        <SummaryRow label="Shipping" value={formatPrice(totals.shipping)} />
        <SummaryRow
          label={`Tax (${totals.taxRate}%)`}
          value={formatPrice(totals.tax)}
        />
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">Total Amount</span>
          <span className="text-lg font-semibold text-foreground tracking-tighter">
            {formatPrice(totals.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold text-muted-foreground">{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
