import { Stat, StatsBar } from "@/components/shared/stats-bar";
import { formatPrice } from "@/lib/utils/format";
import type { CheckoutStats } from "../types/orders";

interface OrdersStatsBarProps {
  stats?: CheckoutStats;
}

export function OrdersStatsBar({ stats }: OrdersStatsBarProps) {
  return (
    <StatsBar>
      <Stat
        icon="solar:clock-circle-linear"
        tone="warning"
        label="Awaiting payment"
        value={stats?.awaitingPayment ?? 0}
        badge={
          stats?.awaitingPayment && stats.awaitingPayment > 0
            ? "Pending"
            : undefined
        }
      />
      <Stat
        icon="solar:document-text-linear"
        tone="primary"
        label="Pending review"
        value={stats?.pendingReview ?? 0}
        // Was a solid `bg-primary` chip with animate-pulse. Solid green means
        // ACTION here, so a solid status chip breaks Green-Does-Double-Duty
        // (DESIGN.md). Urgency now comes from the danger tone, not a fill.
        badge={
          stats?.pendingReview && stats.pendingReview > 0
            ? "Urgent"
            : undefined
        }
        badgeTone="danger"
      />
      <Stat
        icon="solar:calendar-linear"
        tone="success"
        label="Confirmed today"
        value={stats?.confirmedToday ?? 0}
      />
      <Stat
        icon="solar:wallet-linear"
        tone="jewel"
        label="Potential revenue"
        value={formatPrice(stats?.totalRevenuePending ?? 0)}
        badge="Estimated"
      />
    </StatsBar>
  );
}
