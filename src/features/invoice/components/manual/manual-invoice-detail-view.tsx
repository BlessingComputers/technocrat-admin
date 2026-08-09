"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import {
  useCancelManualInvoice,
  useManualInvoiceDetail,
} from "../../api/invoice.queries";
import { ManualInvoiceDetailSkeleton } from "./manual-invoice-detail-skeleton";
import {
  customerName,
  formatInvoiceDate,
  invoiceStatusMeta,
} from "../../utils/invoice-utils";
import type {
  InvoiceStatus,
  ManualInvoice,
  ManualInvoiceLineItem,
} from "../../types/invoice";

interface ManualInvoiceDetailViewProps {
  manualInvoiceId: string;
}

function issuerName(invoice: ManualInvoice): string {
  if (invoice.issuedBy) return invoice.issuedBy;
  const cb = invoice.createdBy;
  if (cb) return `${cb.firstName ?? ""} ${cb.lastName ?? ""}`.trim() || "—";
  return "—";
}

/** The customer captured on the invoice — snapshot first, then fallbacks. */
function detailCustomer(invoice: ManualInvoice) {
  return invoice.customerSnapshot ?? invoice.customer ?? null;
}

function detailCustomerName(invoice: ManualInvoice): string {
  const c = detailCustomer(invoice);
  const name = `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim();
  if (name) return name;
  return invoice.customerName || customerName(c);
}

function detailCustomerEmail(invoice: ManualInvoice): string | undefined {
  return detailCustomer(invoice)?.email ?? invoice.customerEmail ?? undefined;
}

function detailCustomerPhone(invoice: ManualInvoice): string | undefined {
  return detailCustomer(invoice)?.phone ?? invoice.customerPhone ?? undefined;
}

function detailOrderId(invoice: ManualInvoice): string {
  return invoice.orderId ?? invoice.orderNumber ?? "—";
}

/** Flatten whichever address shape the detail endpoint returns into one line. */
function detailBillingAddress(invoice: ManualInvoice): string {
  const addr =
    detailCustomer(invoice)?.address ??
    invoice.billingAddress ??
    invoice.customerAddress ??
    null;
  if (!addr) return "—";
  if (typeof addr === "string") return addr;
  return (
    [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.country]
      .filter((part) => part && String(part).trim())
      .join(", ") || "—"
  );
}

export function ManualInvoiceDetailView({
  manualInvoiceId,
}: ManualInvoiceDetailViewProps) {
  const { data: invoice, isLoading } = useManualInvoiceDetail(manualInvoiceId);
  const cancelMutation = useCancelManualInvoice();
  const [isCancelOpen, setCancelOpen] = useState(false);

  if (isLoading) return <ManualInvoiceDetailSkeleton />;
  if (!invoice) return <ManualInvoiceNotFound />;

  const meta = invoiceStatusMeta(invoice.status as InvoiceStatus);
  const isCancelled = invoice.status === "CANCELLED";

  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-1">
        <Link
          href="/invoices?tab=manual"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <AppIcon icon="solar:arrow-left-linear" className="h-3 w-3" />
          Back
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Invoice Details
        </h1>
      </div>

      {/* Summary header */}
      <Card className="border bg-card p-8">
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
          {/* Left */}
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                Invoice Number
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-foreground">
                  {invoice.invoiceNumber || invoice.manualInvoiceId}
                </span>
                <CopyButton
                  value={invoice.invoiceNumber || invoice.manualInvoiceId}
                />
              </div>
              <span className="mt-2 inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                Manual
              </span>
            </div>
            <InlineDetail label="Order ID">
              {detailOrderId(invoice)}
            </InlineDetail>
            <InlineDetail label="Date">
              {formatInvoiceDate(invoice.createdAt)}
            </InlineDetail>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <InlineDetail label="Payment method">
              {invoice.paymentMethod ?? "—"}
            </InlineDetail>
            <InlineDetail label="Sales Channel">
              {invoice.saleChannel ?? "—"}
            </InlineDetail>
            <div className="flex gap-12 pt-1">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  Total Amount
                </p>
                <p className="text-lg font-black text-foreground">
                  {formatPrice(invoice.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  Status
                </p>
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold",
                    meta.className,
                  )}
                >
                  {meta.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Customer + billing */}
      <Card className="grid grid-cols-1 gap-x-12 gap-y-6 border bg-card p-8 md:grid-cols-2">
        <div>
          <h3 className="mb-4 text-sm font-black text-foreground">
            Customer Information
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 font-bold text-foreground">
              <AppIcon icon="solar:user-linear" className="h-4 w-4 shrink-0" />
              {detailCustomerName(invoice)}
            </p>
            {detailCustomerPhone(invoice) && (
              <p className="flex items-center gap-2">
                <AppIcon
                  icon="solar:phone-linear"
                  className="h-4 w-4 shrink-0"
                />
                {detailCustomerPhone(invoice)}
              </p>
            )}
            {detailCustomerEmail(invoice) && (
              <p className="flex items-center gap-2">
                <AppIcon
                  icon="solar:letter-linear"
                  className="h-4 w-4 shrink-0"
                />
                {detailCustomerEmail(invoice)}
              </p>
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-black text-foreground">
            Billing Address
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {detailBillingAddress(invoice)}
          </p>
        </div>
      </Card>

      <ManualDetailItems items={invoice.lineItems} />

      {/* Amount summary */}
      <Card className="border bg-card p-8">
        <h3 className="mb-4 text-sm font-black text-foreground">
          Amount Summary
        </h3>
        <div className="space-y-3">
          <SummaryRow
            label="Subtotal"
            value={formatPrice(invoice.subtotalAmount)}
          />
          <SummaryRow
            label="Discount"
            value={formatPrice(invoice.discountAmount ?? 0)}
          />
          <SummaryRow
            label={`Tax (${invoice.taxRate}%)`}
            value={formatPrice(invoice.taxAmount)}
          />
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-black text-foreground">
              Total Amount
            </span>
            <span className="text-lg font-black text-foreground">
              {formatPrice(invoice.totalAmount)}
            </span>
          </div>
        </div>
      </Card>

      <Card className="border bg-card p-8">
        <h3 className="mb-2 text-sm font-black text-foreground">Issued by</h3>
        <p className="text-sm font-medium text-muted-foreground">
          {issuerName(invoice)}
        </p>
      </Card>

      <Card className="border bg-card p-8">
        <h3 className="mb-2 text-sm font-black text-foreground">Notes</h3>
        <p className="text-sm font-medium text-muted-foreground">
          {invoice.notes || "—"}
        </p>
      </Card>

      {!isCancelled && (
        <div className="flex justify-center pt-4">
          <Button
            variant="destructive"
            onClick={() => setCancelOpen(true)}
            className="h-12 rounded-lg px-12 font-black"
          >
            Cancel Invoice
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={isCancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() =>
          cancelMutation.mutate(manualInvoiceId, {
            onSuccess: () => setCancelOpen(false),
          })
        }
        title="Cancel Invoice"
        description={`Are you sure you want to cancel ${invoice.manualInvoiceId}? This action is irreversible — the invoice will be marked as CANCELLED and cannot be undone.`}
        confirmText="Yes, Cancel Invoice"
        cancelText="Keep Invoice"
        variant="destructive"
        isPending={cancelMutation.isPending}
      />
    </div>
  );
}

function InlineDetail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="min-w-[120px] shrink-0 text-sm text-muted-foreground">
        {label}:
      </span>
      <span className="text-sm font-bold text-foreground">{children}</span>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState<Boolean>(false);

  function handleCopied() {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(value);
    handleCopied();
  }
  return (
    <button
      type="button"
      onClick={copyToClipboard}
      className="text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Copy invoice number"
    >
      {copied ? (
        <span className="text-green-500 font-bold">Copied!</span>
      ) : (
        <AppIcon icon="solar:copy-linear" className="h-4 w-4" />
      )}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-bold text-muted-foreground">{label}:</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

function ManualDetailItems({ items }: { items: ManualInvoiceLineItem[] }) {
  return (
    <Card className="overflow-hidden border bg-card p-0">
      <div className="p-8 pb-4">
        <h3 className="text-sm font-black text-foreground">Items</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="bg-primary/[0.04]">
              {["Product", "SKU", "Variant", "QTY", "Unit price", "Total"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground first:pl-8"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item, i) => (
              <tr key={item.id ?? i} className="text-sm">
                <td className="px-6 py-4 pl-8 font-bold text-foreground">
                  <span
                    className="block max-w-[240px] truncate"
                    title={item.productName}
                  >
                    {item.productName}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {item.sku || "—"}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {item.variantName || "—"}
                </td>
                <td className="px-6 py-4 font-bold text-foreground">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 font-bold text-foreground">
                  {formatPrice(item.unitPrice)}
                </td>
                <td className="px-6 py-4 font-black text-foreground">
                  {formatPrice(
                    item.totalPrice ?? item.quantity * item.unitPrice,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ManualInvoiceNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
      <AppIcon
        icon="solar:danger-circle-linear"
        className="h-14 w-14 text-destructive"
      />
      <h2 className="text-xl font-black text-foreground">Invoice not found</h2>
      <Link href="/invoices?tab=manual">
        <Button variant="outline" className="rounded-lg px-8 font-bold">
          Back to invoices
        </Button>
      </Link>
    </div>
  );
}
