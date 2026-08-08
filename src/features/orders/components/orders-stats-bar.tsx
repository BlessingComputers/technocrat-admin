import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import type { CheckoutStats } from "../types/orders";

interface OrdersStatsBarProps {
  stats?: CheckoutStats;
}

export function OrdersStatsBar({ stats }: OrdersStatsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-warning/15 text-warning flex items-center justify-center">
            <AppIcon icon="solar:clock-circle-linear" className="w-6 h-6" />
          </div>
          {stats?.awaitingPayment && stats.awaitingPayment > 0 && (
            <span className="px-2 py-1 bg-warning/15 text-warning text-xs font-medium uppercase tracking-wide rounded-full">
              Pending
            </span>
          )}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Awaiting Payment
        </p>
        <h3 className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
          {stats?.awaitingPayment ?? 0}
        </h3>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <AppIcon icon="solar:document-text-linear" className="w-6 h-6" />
          </div>
          {stats?.pendingReview && stats.pendingReview > 0 && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium uppercase tracking-wide rounded-full animate-pulse">
              Urgent
            </span>
          )}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Pending Review
        </p>
        <h3 className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
          {stats?.pendingReview ?? 0}
        </h3>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-success/15 text-success flex items-center justify-center">
            <AppIcon icon="solar:calendar-linear" className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Confirmed Today
        </p>
        <h3 className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
          {stats?.confirmedToday ?? 0}
        </h3>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-gold/15 text-gold-foreground flex items-center justify-center">
            <AppIcon icon="solar:wallet-linear" className="w-6 h-6" />
          </div>
          <span className="px-2 py-1 bg-gold/15 text-gold-foreground text-xs font-medium uppercase tracking-wide rounded-full">
            Estimated
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Potential Revenue
        </p>
        <h3 className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
          {formatPrice(stats?.totalRevenuePending ?? 0)}
        </h3>
      </Card>
    </div>
  );
}
