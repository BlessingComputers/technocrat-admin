import type { GatewayOrderPayment } from "../types/orders";

/**
 * The payment a refund for this order is recorded against. The transactions
 * search matches order numbers with "contains", so rows are matched on the
 * exact order id. An order has at most one PAID payment (the backend rejects a
 * second); a REFUNDED one is shown when no PAID one is left.
 */
export function pickRefundPayment(
  payments: GatewayOrderPayment[],
  orderId: string,
): GatewayOrderPayment | null {
  const own = payments.filter((p) => p.orderId === orderId);
  return (
    own.find((p) => p.status === "PAID") ??
    own.find((p) => p.status === "REFUNDED") ??
    null
  );
}
