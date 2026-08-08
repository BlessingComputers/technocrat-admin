import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { CustomerAnalytics } from "../types/customers";

interface CustomersStatsBarProps {
  analytics?: CustomerAnalytics;
}

function tierCount(analytics: CustomerAnalytics | undefined, tier: string) {
  const entry = analytics?.loyaltyTierBreakdown?.find(
    (t) => t.tier?.toUpperCase() === tier,
  );
  return entry?.count ?? 0;
}

/**
 * KPI strip backed by GET /v1/admin/analytics/customers. The response body is
 * undocumented (ADR-0006), so every field is read defensively with a 0 fallback.
 */
export function CustomersStatsBar({ analytics }: CustomersStatsBarProps) {
  const newSignups =
    analytics?.newSignups ?? analytics?.newSignupsThisPeriod ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-6 border border-border bg-card rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <AppIcon
              icon="solar:users-group-rounded-linear"
              className="w-6 h-6"
            />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
          Total Customers
        </p>
        <h3 className="text-3xl font-black text-foreground tracking-tighter">
          {analytics?.totalCustomers ?? 0}
        </h3>
      </Card>

      <Card className="p-6 border border-border bg-card rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-success/15 text-success flex items-center justify-center">
            <AppIcon icon="solar:user-check-linear" className="w-6 h-6" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
          Active
        </p>
        <h3 className="text-3xl font-black text-foreground tracking-tighter">
          {analytics?.activeCustomers ?? 0}
        </h3>
      </Card>

      <Card className="p-6 border border-border bg-card rounded-lg border-t-4 border-t-primary">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <AppIcon icon="solar:user-plus-linear" className="w-6 h-6" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
          New Signups
        </p>
        <h3 className="text-3xl font-black text-foreground tracking-tighter">
          {newSignups}
        </h3>
      </Card>

      <Card className="p-6 border border-border bg-gold rounded-lg text-black">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-black/10 text-black flex items-center justify-center">
            <AppIcon icon="solar:cup-star-linear" className="w-6 h-6" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">
          Gold + Platinum
        </p>
        <h3 className="text-3xl font-black text-black tracking-tighter">
          {tierCount(analytics, "GOLD") + tierCount(analytics, "PLATINUM")}
        </h3>
      </Card>
    </div>
  );
}
