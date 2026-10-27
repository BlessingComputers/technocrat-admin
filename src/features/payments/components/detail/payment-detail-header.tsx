"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentStatusBadge } from "../payment-status-badge";

interface PaymentDetailHeaderProps {
  paymentId: string;
  status: string;
  actions?: React.ReactNode;
}

export function PaymentDetailHeader({
  paymentId,
  status,
  actions,
}: PaymentDetailHeaderProps) {
  return (
    <PageHeader title={paymentId} description="Gateway transaction detail">
      <Link
        href="/payments"
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary-ink transition-colors pr-6 border-r border-border"
      >
        <AppIcon icon="solar:arrow-left-linear" className="w-3 h-3" />
        Back to Payments
      </Link>
      <div className="flex items-center gap-3">
        {actions}
        <PaymentStatusBadge status={status} />
      </div>
    </PageHeader>
  );
}
