import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { PaymentStatusBadge } from "./payment-status-badge";
import type { AdminTransactionListItem } from "../types/payments";

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export function PaymentTableRow({
  payment,
}: {
  payment: AdminTransactionListItem;
}) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-8 py-4">
        <Link
          href={`/payments/${payment.id}`}
          className="font-semibold text-sm text-primary hover:underline"
        >
          {payment.paymentId}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">
          {new Date(payment.createdAt).toLocaleString(undefined, DATE_OPTS)}
        </div>
      </td>
      <td className="px-8 py-4">
        <div className="text-sm font-medium text-foreground">
          {payment.orderNumber}
        </div>
        <div className="text-xs text-muted-foreground">
          {payment.customerName}
        </div>
      </td>
      <td className="px-8 py-4 text-sm text-foreground">
        {payment.provider}
        {payment.paymentChannel && (
          <span className="text-xs text-muted-foreground">
            {" "}
            · {payment.paymentChannel}
          </span>
        )}
      </td>
      <td className="px-8 py-4">
        <PaymentStatusBadge status={payment.status} />
      </td>
      <td className="px-8 py-4 text-right text-sm font-semibold tabular-nums text-foreground">
        {formatPrice(payment.amount)}
      </td>
      <td className="px-8 py-4 text-right">
        <Link
          href={`/payments/${payment.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          View
          <AppIcon icon="solar:alt-arrow-right-linear" className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}
