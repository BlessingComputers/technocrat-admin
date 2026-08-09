"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { reconcileOutcomeTone } from "../../utils/payment-utils";
import type { AdminTransactionDetail } from "../../types/payments";

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const OUTCOME_COPY: Record<string, string> = {
  RESOLVED: "Re-verified and the payment left PENDING as a result.",
  STILL_PENDING: "Re-verified — still stuck. Try a Miden lookup.",
  ERROR: "The re-verify call itself threw. See the error below.",
  NO_REFERENCE: "No providerReference to look up by.",
};

/**
 * Shows what the stuck-PENDING reconciliation sweep last attempted, so a
 * dismissed notification isn't the only record of it
 * (BACKEND-CONTRACT-DELTA §3.6). Only renders once the sweep has actually run.
 */
export function PaymentReconcileCard({
  payment,
}: {
  payment: AdminTransactionDetail;
}) {
  if (!payment.lastReconcileAt) return null;

  const tone = reconcileOutcomeTone(payment.lastReconcileOutcome);

  return (
    <Card className="p-6 border bg-card space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <AppIcon icon="solar:radar-2-linear" className="w-4 h-4 text-primary" />
        Reconciliation Sweep
      </h3>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Last attempt{" "}
          {new Date(payment.lastReconcileAt).toLocaleString(undefined, DATE_OPTS)}
        </span>
        {payment.lastReconcileOutcome && (
          <Badge variant={tone} className="uppercase tracking-wide">
            {payment.lastReconcileOutcome.replace(/_/g, " ")}
          </Badge>
        )}
      </div>

      <p className="text-sm text-foreground">
        {payment.lastReconcileOutcome
          ? OUTCOME_COPY[payment.lastReconcileOutcome]
          : null}
      </p>

      {payment.lastReconcileError && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive font-mono">
          {payment.lastReconcileError}
        </div>
      )}
    </Card>
  );
}
