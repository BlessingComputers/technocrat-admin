/**
 * Status/type → semantic-token class strings for invoice pills (ADR-0009).
 * Semantic tokens (success/warning/destructive/muted) carry the theme; the
 * categorical `info` (sky) and `outsourced` (violet) tones follow the same raw
 * Tailwind-color pattern already used for `info` in the orders feature.
 */
import type { InvoiceStatus, InvoiceType } from "../types/invoice";

type Tone = "success" | "info" | "violet" | "warning" | "danger" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/25",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  violet:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  warning: "bg-warning/15 text-warning border-warning/25",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  muted: "bg-muted text-muted-foreground border-border",
};

const STATUS_META: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "muted" },
  ISSUED: { label: "Issued", tone: "muted" },
  PAID: { label: "Paid", tone: "success" },
  APPROVED: { label: "Approved", tone: "success" },
  PARTIALLY_APPROVED: { label: "Partially approved", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

/**
 * Outsourced invoices that are PAID but still awaiting a rep's review surface
 * as "Pending review" rather than "Paid" — that's the claim-queue state the
 * comps render in amber.
 */
export function invoiceStatusMeta(
  status: InvoiceStatus,
  invoiceType?: InvoiceType,
): { label: string; tone: Tone; className: string } {
  let meta = STATUS_META[status] ?? { label: status, tone: "muted" as Tone };
  if (status === "PAID" && invoiceType === "OUTSOURCED") {
    meta = { label: "Pending review", tone: "warning" };
  }
  return { ...meta, className: TONE_CLASSES[meta.tone] };
}

export function invoiceStatusClasses(
  status: InvoiceStatus,
  invoiceType?: InvoiceType,
): string {
  return invoiceStatusMeta(status, invoiceType).className;
}

export function invoiceTypeMeta(type: InvoiceType): {
  label: string;
  className: string;
} {
  return type === "INHOUSE"
    ? { label: "In house", className: TONE_CLASSES.info }
    : { label: "Outsourced", className: TONE_CLASSES.violet };
}

export function formatInvoiceDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatInvoiceDateTime(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function customerName(customer?: {
  firstName?: string;
  lastName?: string;
} | null): string {
  if (!customer) return "—";
  return `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "—";
}
