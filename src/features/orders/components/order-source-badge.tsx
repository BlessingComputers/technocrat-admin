import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import type { OrderSource } from "../types/orders";

interface OrderSourceBadgeProps {
  source: OrderSource;
}

const SOURCE_META: Record<
  OrderSource,
  { label: string; icon: string; tone: "info" | "muted" }
> = {
  gateway: { label: "Gateway", icon: "solar:card-linear", tone: "info" },
  manual: {
    label: "Bank Transfer",
    icon: "solar:banknote-2-linear",
    tone: "muted",
  },
};

/**
 * Differentiates the two order flows in the unified list: `gateway` (main order
 * module, online payment) vs `manual` (legacy bank-transfer + proof). Distinct
 * label, icon, and tone so staff can tell at a glance where an order came from.
 */
export function OrderSourceBadge({ source }: OrderSourceBadgeProps) {
  const meta = SOURCE_META[source];
  return (
    <Badge variant={meta.tone} className="gap-1">
      <AppIcon icon={meta.icon} className="w-3 h-3" />
      {meta.label}
    </Badge>
  );
}
