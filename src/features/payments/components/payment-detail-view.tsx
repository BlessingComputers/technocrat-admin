"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { useTransactionDetail } from "../api/payments.queries";
import { PaymentsAccessGate } from "./payments-access-gate";
import { PaymentsNavTabs } from "./payments-nav-tabs";
import { PaymentDetailSkeleton } from "./payments-skeletons";
import { PaymentDetailHeader } from "./detail/payment-detail-header";
import { PaymentSummaryCard } from "./detail/payment-summary-card";
import { PaymentReconcileCard } from "./detail/payment-reconcile-card";
import { PaymentRefundsCard } from "./detail/payment-refunds-card";
import { PaymentRefundDialog } from "./detail/payment-refund-dialog";
import { PaymentMidenCard } from "./detail/payment-miden-card";

const REFUNDABLE = ["PAID", "REFUNDED"];

interface PaymentDetailViewProps {
  paymentId: string;
}

/** Payment detail (route `/payments/[id]`) — PAYMENTS-BACKEND-CONTRACT.md §3. */
export function PaymentDetailView({ paymentId }: PaymentDetailViewProps) {
  return (
    <PaymentsAccessGate>
      <PaymentDetailBody paymentId={paymentId} />
    </PaymentsAccessGate>
  );
}

function PaymentDetailBody({ paymentId }: PaymentDetailViewProps) {
  const { data: payment, isLoading } = useTransactionDetail(paymentId);

  if (isLoading) return <PaymentDetailSkeleton />;
  if (!payment) return <PaymentNotFound />;

  return (
    <div className="space-y-8 pb-20">
      <PaymentsNavTabs />

      <PaymentDetailHeader
        paymentId={payment.paymentId}
        status={payment.status}
        actions={
          REFUNDABLE.includes(payment.status) ? (
            <PaymentRefundDialog payment={payment} />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <PaymentSummaryCard payment={payment} />
          <PaymentReconcileCard payment={payment} />
          <PaymentRefundsCard payment={payment} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <PaymentMidenCard payment={payment} />
        </div>
      </div>
    </div>
  );
}

function PaymentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <AppIcon
        icon="solar:danger-circle-linear"
        className="w-16 h-16 text-destructive-ink"
      />
      <h2 className="text-2xl font-semibold text-foreground">
        Payment Not Found
      </h2>
      <p className="text-muted-foreground font-medium">
        This payment does not exist or could not be loaded.
      </p>
      <Link href="/payments">
        <Button variant="outline" className="rounded-xl px-8 font-medium">
          Return to Payments
        </Button>
      </Link>
    </div>
  );
}
