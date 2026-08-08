import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { CustomersBucket } from "../types/dashboard-kpi";

interface NewCustomersCardProps {
  customers: CustomersBucket;
}

/**
 * "New Customers" KPI card. Structurally different from the other live cards
 * (single solid bar instead of split, total-database row + descriptive text)
 * so it doesn't share the `KpiSplitCard` shell.
 */
export function NewCustomersCard({ customers }: NewCustomersCardProps) {
  return (
    <Card className="hover:border-primary/20 transition-all group relative overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="size-10 rounded-xl flex items-center justify-center bg-info/10 text-info">
            <AppIcon icon="solar:users-group-rounded-bold" className="size-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide bg-info/10 text-info px-2 py-0.5 rounded-md">
            Acquisition
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            New Customers
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            +{(customers.new || 0).toLocaleString()}
          </h3>
        </div>

        <div className="space-y-1 pt-1.5">
          <div className="h-1.5 w-full bg-muted/60 rounded-full flex overflow-hidden">
            <div
              className="bg-info rounded-full"
              style={{ width: "100%" }}
            />
          </div>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            Registration rate active
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="font-bold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-info" />
              Total Database
            </span>
            <span className="font-extrabold text-foreground">
              {(customers.total || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Registered customers across all periods.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
