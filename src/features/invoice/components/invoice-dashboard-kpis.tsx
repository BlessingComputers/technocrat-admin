import { StatsBar } from "@/components/shared/stats-bar";
import { formatPrice } from "@/lib/utils/format";
import { InvoiceKpiCard } from "./kpis/invoice-kpi-card";
import type { InvoiceDashboard } from "../types/invoice";

interface InvoiceDashboardKpisProps {
  data?: InvoiceDashboard;
  isLoading?: boolean;
}

/**
 * The four-up KPI row (screens 1, 4, 10).
 *
 * Ticket 07: the enclosing gray panel is gone. `<StatsBar>` is itself a card,
 * so wrapping it in `bg-muted/40` nested a panel inside a panel — the thing
 * DESIGN.md's never-nest-a-card rule exists to prevent.
 */
export function InvoiceDashboardKpis({
  data,
  isLoading,
}: InvoiceDashboardKpisProps) {
  return (
    <StatsBar>
      <InvoiceKpiCard
        title="Total invoiced"
        value={formatPrice(data?.totalInvoiced ?? 0)}
        icon="solar:bill-list-linear"
        tone="primary"
        isLoading={isLoading}
      />
      <InvoiceKpiCard
        title="Pending review"
        value={data?.pendingReview ?? 0}
        icon="solar:bill-list-linear"
        tone="warning"
        note={data?.pendingReview ? "Action required" : undefined}
        isLoading={isLoading}
        href="/invoices/pending-review"
      />
      <InvoiceKpiCard
        title="Approved"
        value={data?.approved ?? 0}
        icon="solar:bill-check-linear"
        tone="success"
        isLoading={isLoading}
      />
      <InvoiceKpiCard
        title="Rejected"
        value={data?.rejected ?? 0}
        icon="solar:bill-cross-linear"
        tone="danger"
        note={data?.rejected ? "Process refund" : undefined}
        isLoading={isLoading}
        href="/invoices/rejected"
      />
    </StatsBar>
  );
}
