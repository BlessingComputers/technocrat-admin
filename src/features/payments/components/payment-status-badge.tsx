import { Badge } from "@/components/ui/badge";
import { paymentStatusTone } from "../utils/payment-utils";

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={paymentStatusTone(status)}>
      {status || "PENDING"}
    </Badge>
  );
}
