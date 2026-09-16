"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/error-message";
import { usePermissions } from "@/lib/auth/use-permissions";
import { PREORDER_PERMISSIONS } from "../../constants/preorder-permissions";
import {
  useApprovePreorderPaymentEvidence,
  useRejectPreorderPaymentEvidence,
  useReviewPreorderPaymentEvidence,
} from "../../api/preorder.queries";
import type { PreorderPaymentRequest } from "../../types/preorders";

export function PreorderPaymentEvidenceReview({
  preorderId,
  payment,
  allowReview = true,
}: {
  preorderId: string;
  payment: PreorderPaymentRequest;
  allowReview?: boolean;
}) {
  const [reason, setReason] = useState("");
  const review = useReviewPreorderPaymentEvidence();
  const approve = useApprovePreorderPaymentEvidence();
  const reject = useRejectPreorderPaymentEvidence();
  const evidence = payment.evidence?.[0];
  const { can } = usePermissions();
  const canReview = allowReview && can(PREORDER_PERMISSIONS.reviewEvidence);
  const canDecide =
    payment.status === "PROOF_SUBMITTED" || payment.status === "UNDER_REVIEW";
  const pending = review.isPending || approve.isPending || reject.isPending;

  if (!evidence) return null;

  function run(
    action: typeof review | typeof approve | typeof reject,
    success: string,
    rejectionReason?: string,
  ) {
    action.mutate(
      { preorderId, requestId: payment.id, reason: rejectionReason },
      {
        onSuccess: () => toast.success(success),
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not update this payment")),
      },
    );
  }

  return (
    <div className="space-y-5 border-t border-border pt-6">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Transaction reference</p>
          <p className="mt-1 font-medium text-foreground">{evidence.transactionReference}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Customer note</p>
          <p className="mt-1 text-foreground">{evidence.customerNote || "No note provided"}</p>
        </div>
      </div>

      <a href={evidence.fileUrl} target="_blank" rel="noreferrer" className="inline-flex font-medium text-primary-ink hover:underline">
        Open receipt image
      </a>

      {canDecide && canReview && (
        <div className="space-y-3">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Reason shown to the customer if this receipt is rejected" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run(approve, "Payment approved")} disabled={pending}>Approve payment</Button>
            {payment.status === "PROOF_SUBMITTED" && (
              <Button variant="outline" onClick={() => run(review, "Payment marked as under review")} disabled={pending}>Mark under review</Button>
            )}
            <Button variant="destructive" onClick={() => run(reject, "Receipt rejected", reason.trim())} disabled={pending || !reason.trim()} className="disabled:cursor-not-allowed">Reject with reason</Button>
          </div>
        </div>
      )}
    </div>
  );
}
