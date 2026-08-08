import { Badge } from "@/components/ui/badge";
import { paymentStatusTone } from "../utils/payment-utils";

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={paymentStatusTone(status)} className="uppercase tracking-wide">
      {status || "PENDING"}
    </Badge>
  );
}
