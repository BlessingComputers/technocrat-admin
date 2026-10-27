"use client";

import Link from "next/link";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { getMidenReference } from "../../utils/payment-utils";
import type { AdminTransactionDetail } from "../../types/payments";
import { MetaLabel } from "@/components/shared/meta-label";

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function fmt(value: string | null) {
  return value ? new Date(value).toLocaleString(undefined, DATE_OPTS) : "—";
}

export function PaymentSummaryCard({
  payment,
}: {
  payment: AdminTransactionDetail;
}) {
  const midenReference = getMidenReference(payment.gatewayResponse);

  function copyMidenReference() {
    if (!midenReference) return;
    navigator.clipboard
      ?.writeText(midenReference)
      .then(() => toast.success("Miden reference copied"))
      .catch(() => undefined);
  }

  return (
    <Card className="p-6 space-y-5">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <AppIcon icon="solar:bill-list-linear" className="w-4 h-4 text-primary-ink" />
        Transaction Summary
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <Row label="Amount" value={formatPrice(payment.amount)} bold />
        <Row
          label="Net"
          value={
            payment.netAmount != null ? formatPrice(payment.netAmount) : "—"
          }
        />
        <Row
          label="Processing Fee"
          value={
            payment.processingFee != null
              ? formatPrice(payment.processingFee)
              : "—"
          }
        />
        <Row label="Currency" value={payment.currency} />
        <Row label="Provider" value={payment.provider} />
        <Row
          label="Channel"
          value={payment.paymentChannel || payment.paymentMethod || "—"}
        />
        <Row
          label="Reference"
          value={payment.providerReference || "—"}
          mono
        />
        {payment.provider === "miden" && (
          <Row
            label="Miden Reference"
            value={
              midenReference ? (
                <button
                  type="button"
                  onClick={copyMidenReference}
                  className="inline-flex items-center gap-1.5 hover:text-primary-ink"
                  aria-label="Copy Miden reference"
                >
                  {midenReference}
                  <AppIcon icon="solar:copy-linear" className="w-3 h-3 shrink-0" />
                </button>
              ) : (
                "—"
              )
            }
            mono
          />
        )}
        <Row
          label="Order"
          value={
            <Link
              href={`/orders/gateway/${payment.orderId}`}
              className="text-primary-ink hover:underline"
            >
              {payment.orderNumber}
            </Link>
          }
        />
        <Row label="Customer" value={payment.customerName} />
        <Row label="Created" value={fmt(payment.createdAt)} />
        <Row label="Completed" value={fmt(payment.completedAt)} />
        <Row label="Failed" value={fmt(payment.failedAt)} />
      </div>

      {(payment.errorCode || payment.errorMessage) && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 space-y-1">
          <p className="text-xs font-semibold text-destructive-ink">
            {payment.errorCode || "Error"}
          </p>
          {payment.errorMessage && (
            <p className="text-xs text-destructive-ink/80">
              {payment.errorMessage}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <MetaLabel className="block">
        {label}
      </MetaLabel>
      <div
        className={`text-sm text-foreground ${bold ? "font-semibold" : "font-medium"} ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
