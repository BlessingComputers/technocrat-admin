import { Badge } from "@/components/ui/badge";
import { orderStatusTone, paymentStatusTone } from "../utils/order-utils";

interface OrderStatusBadgeProps {
  status: string;
  variant: "order" | "payment";
}

/**
 * Order / payment status pill. Renders through the shared `<Badge>` so status
 * colour comes from one place (the design-system tokens), consistent with the
 * dashboard and every other status surface.
 */
export function OrderStatusBadge({ status, variant }: OrderStatusBadgeProps) {
  const tone =
    variant === "order" ? orderStatusTone(status) : paymentStatusTone(status);

  const label =
    status?.replace(/_/g, " ") || (variant === "order" ? "UNKNOWN" : "PENDING");

  return (
    <Badge variant={tone}>
      {label}
    </Badge>
  );
}
