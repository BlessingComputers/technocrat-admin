import { Stat, StatsBar } from "@/components/shared/stats-bar";
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
      label: "Total orders",
      value: String(totalOrders),
    },
    {
      icon: "solar:wallet-linear",
      label: "Lifetime value",
      value: formatPrice(totalSpent),
    },
    {
      icon: "solar:chart-2-linear",
      label: "Avg. order",
      value: formatPrice(avgOrderValue),
    },
    {
      icon: "solar:clock-circle-linear",
      label: "Last order",
      value: formatDate(lastOrderAt),
    },
  ];

  return (
    <StatsBar>
      {items.map((item) => (
        <Stat
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
        />
      ))}
    </StatsBar>
  );
}
