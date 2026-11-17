"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { useStaffSession } from "@/lib/auth/session-context";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { useGatewayOrderPayment } from "../../api/orders.queries";

const HAS_PAYMENT = ["PAID", "REFUNDED"];

/**
 * Opens the order's payment, where a super admin records a refund. Refunds
 * are recorded on the payment (`POST /payments/refund`), so a cancelled paid
 * order needs this way across. Super admins only, like the payments section.
 * Recording sends no money: staff pay the customer in the gateway's dashboard
 * or by bank transfer first (the refund dialog says so).
 */
export function OrderRefundLink({
  orderId,
  orderNumber,
  paymentStatus,
}: {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
}) {
  const { staffSession } = useStaffSession();
  const enabled =
    isSuperAdmin(staffSession) && HAS_PAYMENT.includes(paymentStatus);
  const { data: payment } = useGatewayOrderPayment(
    orderId,
    orderNumber,
    enabled,
  );

  if (!enabled || !payment) return null;

  return (
    <Button asChild variant="outline" className="h-10 px-4 rounded-lg font-medium text-xs">
      <Link href={`/payments/${payment.id}`}>
        <AppIcon icon="solar:card-recive-linear" className="w-3 h-3 mr-2" />
        {payment.status === "REFUNDED" ? "View Refund" : "Record Refund"}
      </Link>
    </Button>
  );
}
