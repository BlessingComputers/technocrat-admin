/**
 * Status → tone mapping for order/payment badges (ADR-0009).
 * Tones map 1:1 onto the shared `<Badge>` variants, so status colour lives in
 * one place — the design-system tokens. No hardcoded palette colours:
 * success / warning / destructive / info are all theme tokens.
 *
 * `getStatusColor` returns the raw tone classes for the few non-Badge surfaces
 * (e.g. the order-detail header pill); table/list badges render through `<Badge
 * variant={tone}>` instead.
 */
import type { AdminOrderRow, AllOrdersRow } from "../types/orders";

type StatusTone = "success" | "info" | "warning" | "danger" | "muted";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success/15 text-success border-success/25",
  info: "bg-info/15 text-info border-info/25",
  warning: "bg-warning/15 text-warning border-warning/25",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  muted: "bg-muted text-muted-foreground border-border",
};

export function orderStatusTone(status: string): StatusTone {
  const s = status?.toUpperCase() ?? "";
  if (s === "COMPLETED" || s === "DELIVERED" || s === "PAYMENT_CONFIRMED") {
    return "success";
  }
  if (s === "OUT_FOR_DELIVERY" || s === "ASSIGNED") return "info";
  if (s === "PROCESSING" || s === "PROOF_SUBMITTED") return "info";
  if (s === "PENDING" || s === "AWAITING_PAYMENT") return "warning";
  if (s.includes("CANCEL") || s.includes("REJECT")) return "danger";
  return "muted";
}

export function paymentStatusTone(status: string): StatusTone {
  switch (status?.toUpperCase()) {
    case "CONFIRMED":
      return "success";
    case "PROOF_UPLOADED":
      return "info";
    case "REJECTED":
      return "danger";
    case "PENDING":
    default:
      return "warning";
  }
}

export function getStatusColor(status: string): string {
  return TONE_CLASSES[orderStatusTone(status)];
}

// ── Combined-list row normalizer ──────────────────────────────────────────────
// Maps one row from the backend's `GET /all-orders` (AllOrdersRow) into the
// shared UI `AdminOrderRow`. The combined list now carries full line items for
// the rows on the current page, so the products column shows real names and
// counts for both sources — as do customer details (the old client-side merge
// left gateway rows nameless).

export function allOrdersRowToAdminRow(row: AllOrdersRow): AdminOrderRow {
  const isOnline = row.source === "ONLINE";
  const c = row.customer;
  // Tolerate a backend that predates the items enrichment rather than crashing
  // the whole list on `undefined.length` — an older deploy just renders "No items".
  const items = row.items ?? [];
  return {
    source: isOnline ? "gateway" : "manual",
    key: `${row.source}:${row.id}`,
    // Gateway detail resolves by DB id; manual detail resolves by its human id.
    detailHref: isOnline
      ? `/orders/gateway/${row.id}`
      : `/orders/${row.displayId}`,
    reference: row.displayId,
    createdAt: row.createdAt,
    customerName: c ? `${c.firstName} ${c.lastName}`.trim() || null : null,
    customerEmail: c?.email ?? null,
    customerPhone: c?.phone ?? null,
    customerId: c?.id ?? null,
    orderStatus: row.orderStatus,
    paymentStatus: row.paymentStatus,
    totalAmount: row.totalAmount,
    deliveryMethod: row.deliveryMethod,
    itemCount: items.length,
    firstItemName: items[0]?.productName ?? null,
  };
}
