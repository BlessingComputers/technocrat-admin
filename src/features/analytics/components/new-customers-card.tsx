import { Stat } from "@/components/shared/stats-bar";
import type { CustomersBucket } from "../types/dashboard-kpi";

interface NewCustomersCardProps {
  customers: CustomersBucket;
}

/**
 * "New customers" KPI cell. Structurally richer than the split cards (single
 * solid bar instead of a split, plus a total-database row), but it renders
 * through the same `<Stat>` so it sits flush in the `<StatsBar>` panel.
 *
 * Ticket 07: this was a bare `<Card>` dropped inside the KPI grid. Once the
 * grid became a single panel, that nested card drew its own radius and border
 * inside the panel — visibly the odd cell out. Never nest a card (DESIGN.md).
 */
export function NewCustomersCard({ customers }: NewCustomersCardProps) {
  return (
    <Stat
      icon="solar:users-group-rounded-linear"
      tone="info"
      label="New customers"
      value={`+${(customers.new || 0).toLocaleString()}`}
      badge="Acquisition"
      badgeTone="info"
      footer={
        <>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div className="w-full rounded-full bg-info" />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Registration rate active
          </div>

          <div className="mt-3 space-y-1.5 border-t border-border pt-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full bg-info" />
                Total database
              </span>
              <span className="font-semibold text-foreground">
                {(customers.total || 0).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Registered customers across all periods.
            </div>
          </div>
        </>
      }
    />
  );
}
