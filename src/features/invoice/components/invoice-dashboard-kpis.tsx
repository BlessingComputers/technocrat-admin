import { formatPrice } from "@/lib/utils/format";
import { InvoiceKpiCard } from "./kpis/invoice-kpi-card";
import type { InvoiceDashboard } from "../types/invoice";

interface InvoiceDashboardKpisProps {
  data?: InvoiceDashboard;
  isLoading?: boolean;
}

/** The four-up KPI row on a subtle gray panel (screens 1, 4, 10). */
export function InvoiceDashboardKpis({
  data,
  isLoading,
}: InvoiceDashboardKpisProps) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <InvoiceKpiCard
          title="Total Invoiced"
          value={formatPrice(data?.totalInvoiced ?? 0)}
          icon="solar:bill-list-linear"
          iconClassName="text-foreground/70"
          isLoading={isLoading}
        />
        <InvoiceKpiCard
          title="Pending Review"
          value={data?.pendingReview ?? 0}
          icon="solar:bill-list-linear"
          iconClassName="text-warning"
          note={data?.pendingReview ? "Action required" : undefined}
          noteClassName="text-warning"
          isLoading={isLoading}
          href="/invoices/pending-review"
        />
        <InvoiceKpiCard
          title="Approved"
          value={data?.approved ?? 0}
          icon="solar:bill-check-linear"
          iconClassName="text-success"
          isLoading={isLoading}
        />
        <InvoiceKpiCard
          title="Rejected"
          value={data?.rejected ?? 0}
          icon="solar:bill-cross-linear"
          iconClassName="text-destructive"
          note={data?.rejected ? "Process refund" : undefined}
          noteClassName="text-destructive"
          isLoading={isLoading}
          href="/invoices/rejected"
        />
      </div>
    </div>
  );
}
