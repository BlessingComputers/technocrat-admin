"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { usePermissions } from "@/lib/auth/use-permissions";
import { PREORDER_PERMISSIONS } from "../../constants/preorder-permissions";
import { getErrorMessage } from "@/lib/api/error-message";
import { usePreorderPaymentHistory, useUpdatePreorderStatus } from "../../api/preorder.queries";
import { useMarkPreorderRefunded } from "../../api/preorder-closure.queries";
import type { Preorder, PreorderRefund } from "../../types/preorders";
import { approvedPaymentAmount, canFulfilPayment, hasApprovedPayment } from "../../utils/preorder-closure";
import { formatNaira } from "../../utils/payment-terms";
import { PreorderCancellationForm } from "./preorder-cancellation-form";

export function PreorderClosurePanel({ preorder }: { preorder: Preorder }) {
  const history = usePreorderPaymentHistory(preorder.id);
  const update = useUpdatePreorderStatus();
  const { can } = usePermissions();
  const [confirming, setConfirming] = useState(false);
  if (preorder.status === "CANCELLED") {
    return preorder.refund ? <PreorderRefundCard preorderId={preorder.id} refund={preorder.refund} /> : null;
  }
  if (preorder.status === "FULFILLED") return null;
  const ready = !history.isFetching && !history.isError && history.data !== undefined;
  const consistent = preorder.paymentSummary != null || history.data?.length === 0;
  const canFulfil = ready && canFulfilPayment(preorder.paymentSummary, history.data);
  const paid = history.data ? hasApprovedPayment(history.data) : false;

  function fulfil() {
    if (!canFulfil || !can(PREORDER_PERMISSIONS.issueTerms) || update.isPending) return;
    update.mutate({ id: preorder.id, status: "FULFILLED" }, {
      onSuccess: () => { setConfirming(false); toast.success("Preorder marked fulfilled"); },
      onError: (error) => toast.error(getErrorMessage(error, "Could not mark this preorder fulfilled")),
    });
  }

  return <Card className="space-y-5 p-8">
    <h2 className="text-xl font-semibold">Fulfilment and cancellation</h2>
    {!ready || !consistent ? <div className="space-y-3 text-sm">
      <p>Payment details must load before this preorder can be closed.</p>
      {history.isError && <Button variant="outline" onClick={() => void history.refetch()}>Retry payment history</Button>}
    </div> : <>
      {can(PREORDER_PERMISSIONS.issueTerms) && <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Payment approval does not confirm delivery. Mark fulfilled only after the customer receives the item.</p>
        {!canFulfil && <p className="text-sm text-warning-ink">All payments, including the remaining balance, must be approved before fulfilment.</p>}
        <Button disabled={!canFulfil || update.isPending} onClick={() => setConfirming(true)}>Mark fulfilled</Button>
      </div>}
      {can(PREORDER_PERMISSIONS.cancelWithResolution) && <details className="border-t border-border pt-4">
        <summary className="cursor-pointer text-sm font-medium">Cancel preorder</summary>
        <div className="pt-4">
          <PreorderCancellationForm
            preorderId={preorder.id}
            approvedAmount={paid ? approvedPaymentAmount(history.data ?? []) : 0}
          />
        </div>
      </details>}
    </>}
    <ConfirmModal isOpen={confirming} onClose={() => setConfirming(false)} onConfirm={fulfil} isPending={update.isPending} title="Has the customer received the item?" description="This marks the preorder fulfilled. It does not approve or collect a payment." confirmText="Customer received the item" />
  </Card>;
}

const RESOLUTION_LABELS: Record<PreorderRefund["resolution"], string> = {
  FULL_REFUND: "Full refund",
  PARTIAL_REFUND: "Partial refund",
  STORE_CREDIT: "Store credit",
  NO_REFUND: "No refund",
};

function PreorderRefundCard({ preorderId, refund }: { preorderId: string; refund: PreorderRefund }) {
  const markRefunded = useMarkPreorderRefunded(preorderId);
  const { can } = usePermissions();

  return <Card className="space-y-4 p-8">
    <div>
      <h2 className="text-xl font-semibold">Cancellation resolution</h2>
      <p className="mt-1 text-sm text-muted-foreground">{refund.refundId}</p>
    </div>
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="text-muted-foreground">Resolution</dt><dd className="font-medium">{RESOLUTION_LABELS[refund.resolution]}</dd></div>
      <div><dt className="text-muted-foreground">Amount</dt><dd className="font-medium">{formatNaira(refund.amount)}</dd></div>
      <div className="sm:col-span-2"><dt className="text-muted-foreground">Customer-visible reason</dt><dd className="font-medium">{refund.reason}</dd></div>
      <div><dt className="text-muted-foreground">Work status</dt><dd className="font-medium">{refund.workStatus === "REFUNDED" ? "Completed" : "Action required"}</dd></div>
    </dl>
    {refund.workStatus === "REFUND_REQUIRED" && can(PREORDER_PERMISSIONS.cancelWithResolution) && <Button
      onClick={() => markRefunded.mutate(refund.id, {
        onSuccess: () => toast.success("Resolution marked completed. Customer notified."),
        onError: (error) => toast.error(getErrorMessage(error, "Could not mark this resolution completed")),
      })}
      disabled={markRefunded.isPending}
    >{markRefunded.isPending ? "Saving..." : "Mark resolution completed"}</Button>}
  </Card>;
}
