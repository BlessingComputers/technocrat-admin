import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { formatDate, toAmount } from "../../utils/customer-utils";
import type {
  CustomerDetail,
  CustomerOrderSummary,
  CustomerPaymentStats,
} from "../../types/customers";

interface CustomerStatsCardsProps {
  customer: CustomerDetail;
  /** Fetched order history — fills the count/last-order gaps if stats omit them. */
  orders?: CustomerOrderSummary[];
}

/** Coalesce stats from the possible locations the backend might return. */
function resolveStats(customer: CustomerDetail): CustomerPaymentStats {
  return customer.paymentStats ?? customer.stats ?? {};
}

export function CustomerStatsCards({
  customer,
  orders = [],
}: CustomerStatsCardsProps) {
  const stats = resolveStats(customer);

  const totalOrders =
    stats.totalOrders ?? customer.totalOrders ?? orders.length;
  const totalSpent = toAmount(stats.totalSpent ?? customer.totalSpent);
  const avgOrderValue = toAmount(
    stats.averageOrderValue ??
      (totalOrders > 0 ? totalSpent / totalOrders : 0),
  );
  const lastOrderAt =
    stats.lastOrderAt ?? customer.lastOrderAt ?? orders[0]?.createdAt;

  const items = [
    {
      icon: "solar:bag-4-linear",
      label: "Total Orders",
      value: String(totalOrders),
    },
    {
      icon: "solar:wallet-linear",
      label: "Lifetime Value",
      value: formatPrice(totalSpent),
    },
    {
      icon: "solar:chart-2-linear",
      label: "Avg. Order",
      value: formatPrice(avgOrderValue),
    },
    {
      icon: "solar:clock-circle-linear",
      label: "Last Order",
      value: formatDate(lastOrderAt),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="p-5 border border-border bg-card rounded-xl"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
            <AppIcon icon={item.icon} className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            {item.label}
          </p>
          <h3 className="text-xl font-black text-foreground tracking-tighter truncate">
            {item.value}
          </h3>
        </Card>
      ))}
    </div>
  );
}
