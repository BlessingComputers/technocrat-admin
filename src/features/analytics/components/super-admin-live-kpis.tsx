import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { KpiSplitCard } from "./kpi-split-card";
import { NewCustomersCard } from "./new-customers-card";
import type { SuperAdminLiveKpiData } from "../types/dashboard-kpi";

interface SuperAdminLiveKpisProps {
  data: SuperAdminLiveKpiData;
}

/** Safe percentage from a numerator/denominator, avoiding division by zero. */
function pct(num: number, denom: number): number {
  if (!denom) return 0;
  return Math.round((num / denom) * 100);
}

/**
 * The four live KPI cards row shown to super admins: combined revenue,
 * combined orders, new customers, refunds. Data adapters live here so the
 * card components stay presentation-only.
 */
export function SuperAdminLiveKpis({ data }: SuperAdminLiveKpisProps) {
  const revenue = data.revenue || {};
  const orders = data.orders || {};
  const refunds = data.refunds || {};
  const customers = data.customers || {};

  const totalRev = revenue.combined?.revenue || 0;
  const onlineRev = revenue.online?.revenue || 0;
  const manualRev = revenue.manual?.revenue || 0;

  const totalOrd = orders.combined?.orders || 0;
  const onlineOrd = orders.online?.orders || 0;
  const manualOrd = orders.manual?.orders || 0;

  const totalRef = refunds.combined?.amount || 0;
  const onlineRef = refunds.online?.amount || 0;
  const manualRef = refunds.manual?.amount || 0;

  const onlineRevPct = pct(onlineRev, totalRev);
  const manualRevPct = pct(manualRev, totalRev);
  const onlineOrdPct = pct(onlineOrd, totalOrd);
  const manualOrdPct = pct(manualOrd, totalOrd);
  const onlineRefPct = pct(onlineRef, totalRef);
  const manualRefPct = pct(manualRef, totalRef);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiSplitCard
        icon={<AppIcon icon="solar:chart-2-bold" className="size-5" />}
        iconColorClass="bg-primary/10 text-primary"
        badgeLabel="Live Combined"
        badgeColorClass="bg-success/10 text-success"
        title="Total Revenue"
        value={formatPrice(totalRev)}
        split={{
          firstColor: "bg-primary",
          firstPct: onlineRevPct,
          firstCaption: `Online (${onlineRevPct}%)`,
          secondColor: "bg-warning",
          secondPct: manualRevPct,
          secondCaption: `Manual (${manualRevPct}%)`,
        }}
        rows={[
          {
            dotColor: "bg-primary",
            label: "Online",
            value: formatPrice(onlineRev),
          },
          {
            dotColor: "bg-warning",
            label: "Manual",
            value: formatPrice(manualRev),
          },
        ]}
      />

      <KpiSplitCard
        icon={<AppIcon icon="solar:cart-large-2-bold" className="size-5" />}
        iconColorClass="bg-warning/15 text-warning"
        badgeLabel="Live Combined"
        badgeColorClass="bg-success/10 text-success"
        title="Total Orders"
        value={totalOrd.toLocaleString()}
        split={{
          firstColor: "bg-primary",
          firstPct: onlineOrdPct,
          firstCaption: `Online (${onlineOrdPct}%)`,
          secondColor: "bg-warning",
          secondPct: manualOrdPct,
          secondCaption: `Manual (${manualOrdPct}%)`,
        }}
        rows={[
          {
            dotColor: "bg-primary",
            label: "Online",
            value: String(onlineOrd),
            suffix: `(${formatPrice(orders.online?.avgOrderValue || 0)} avg)`,
          },
          {
            dotColor: "bg-warning",
            label: "Manual",
            value: String(manualOrd),
            suffix: `(${formatPrice(orders.manual?.avgOrderValue || 0)} avg)`,
          },
        ]}
      />

      <NewCustomersCard customers={customers} />

      <KpiSplitCard
        icon={<AppIcon icon="solar:dollar-minimalistic-bold" className="size-5" />}
        iconColorClass="bg-destructive/12 text-destructive"
        badgeLabel="Adjustments"
        badgeColorClass="bg-destructive/10 text-destructive"
        title="Total Refunds"
        value={formatPrice(totalRef)}
        split={{
          firstColor: "bg-primary",
          firstPct: onlineRefPct,
          firstCaption: `Online (${onlineRefPct}%)`,
          secondColor: "bg-warning",
          secondPct: manualRefPct,
          secondCaption: `Manual (${manualRefPct}%)`,
        }}
        rows={[
          {
            dotColor: "bg-primary",
            label: "Online",
            value: formatPrice(onlineRef),
            suffix: `(${refunds.online?.count || 0})`,
          },
          {
            dotColor: "bg-warning",
            label: "Manual",
            value: formatPrice(manualRef),
            suffix: `(${refunds.manual?.count || 0})`,
          },
        ]}
      />
    </div>
  );
}
