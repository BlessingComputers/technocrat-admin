"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { paymentStatusTone } from "../../utils/payment-utils";
import type { AdminTransactionDetail } from "../../types/payments";

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export function PaymentRefundsCard({
  payment,
}: {
  payment: AdminTransactionDetail;
}) {
  const refunds = payment.refunds ?? [];

  return (
    <Card className="p-6 border bg-card space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <AppIcon icon="solar:card-recive-linear" className="w-4 h-4 text-primary" />
        Refunds
      </h3>

      {refunds.length === 0 ? (
        <p className="text-sm text-muted-foreground">No refunds recorded.</p>
      ) : (
        <div className="divide-y divide-border/60">
          {refunds.map((refund) => (
            <div
              key={refund.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {refund.refundId}
                </div>
                <div className="text-xs text-muted-foreground">
                  {refund.reason}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(refund.createdAt).toLocaleDateString(
                    undefined,
                    DATE_OPTS,
                  )}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm font-bold tabular-nums text-foreground">
                  {formatPrice(refund.amount)}
                </div>
                <Badge variant={paymentStatusTone(refund.status)}>
                  {refund.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
