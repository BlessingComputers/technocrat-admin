import { Stat, StatsBar } from "@/components/shared/stats-bar";
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
 *
 * Ticket 07 dropped two Blessing-era emphasis devices here: the solid jewel
 * "Gold + Platinum" panel and the primary top-stripe on New Signups. Under the
 * No-Jewel-Tier rule a highlight earns attention through weight, size or
 * position — not a fourth colour — and the cells now share one instrument
 * surface, where a lone inverted cell reads as a defect.
 *
 * NOTE: "Gold + Platinum" is a backend LOYALTY TIER name (GOLD / PLATINUM),
 * not the deleted jewel-tier colour token. It stays — never let a colour
 * rename touch these.
 */
export function CustomersStatsBar({ analytics }: CustomersStatsBarProps) {
  const newSignups =
    analytics?.newSignups ?? analytics?.newSignupsThisPeriod ?? 0;

  return (
    <StatsBar>
      <Stat
        icon="solar:users-group-rounded-linear"
        tone="primary"
        label="Total customers"
        value={analytics?.totalCustomers ?? 0}
      />
      <Stat
        icon="solar:user-check-linear"
        tone="success"
        label="Active"
        value={analytics?.activeCustomers ?? 0}
      />
      <Stat
        icon="solar:user-plus-linear"
        // Was a hardcoded `bg-sky-500/10 text-sky-600` — off-palette, and one
        // of only three raw colour values in the app. `info` is the token.
        tone="info"
        label="New signups"
        value={newSignups}
      />
      <Stat
        icon="solar:cup-star-linear"
        tone="jewel"
        label="Gold + Platinum"
        value={tierCount(analytics, "GOLD") + tierCount(analytics, "PLATINUM")}
      />
    </StatsBar>
  );
}
