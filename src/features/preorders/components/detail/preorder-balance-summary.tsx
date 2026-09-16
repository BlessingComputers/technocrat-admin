"use client";

import { usePermissions } from "@/lib/auth/use-permissions";
import { PREORDER_PERMISSIONS } from "../../constants/preorder-permissions";
import type { PreorderPaymentRequest } from "../../types/preorders";
import { canExtendPayment } from "../../utils/payment-changes";
import { formatNaira, formatWestAfricaTime } from "../../utils/payment-terms";
import { paymentCollectionMethodLabel, paymentStatusLabel } from "../../utils/preorder-payment";
import { PreorderDeadlineForm } from "./preorder-deadline-form";
import { PreorderHandoffCollectionForm } from "./preorder-handoff-collection-form";
import { PreorderPaymentEvidenceReview } from "./preorder-payment-evidence-review";

export function PreorderBalanceSummary({ payment, editable }: { payment: PreorderPaymentRequest; editable: boolean }) {
  const { can } = usePermissions();
  const handoff = payment.collectionMethod === "PAY_AT_HANDOFF";
  const account = payment.bankAccountSnapshot;

  return (
    <div className="space-y-5">
      <p className="font-semibold">{formatNaira(payment.amount)}</p>
      <p className="text-sm text-muted-foreground">{paymentStatusLabel(payment.status)}. {paymentCollectionMethodLabel(payment.collectionMethod)}.</p>
      {!handoff && payment.payBy && <p className="text-sm">Deadline: {formatWestAfricaTime(payment.payBy)}</p>}
      {!handoff && account && <div className="rounded-lg bg-muted/50 p-4 text-sm"><p>{account.bankName}</p><p>{account.accountName} · {account.accountNumber}</p></div>}
      {handoff ? <div className="space-y-3 text-sm">
        <p>No receipt upload or payment deadline applies to this balance.</p>
        {payment.collectedAt && <p>Collected {formatWestAfricaTime(payment.collectedAt)} by staff {payment.collectedByStaffId ?? "not recorded"}. Method: {payment.collectedPaymentMethod ?? "not recorded"}{payment.collectedTransactionReference ? `. Reference: ${payment.collectedTransactionReference}` : ""}.</p>}
        {editable && payment.status !== "APPROVED" && can(PREORDER_PERMISSIONS.collectAtHandoff) && <>
          <PreorderHandoffCollectionForm preorderId={payment.preorderId} requestId={payment.id} />
        </>}
      </div> : <>
        <PreorderPaymentEvidenceReview preorderId={payment.preorderId} payment={payment} allowReview={editable} />
        {editable && can(PREORDER_PERMISSIONS.issueTerms) && canExtendPayment(payment) && <details>
          <summary className="cursor-pointer text-sm font-medium">Extend balance deadline</summary>
          <div className="pt-4"><PreorderDeadlineForm key={`${payment.id}-${payment.payBy}`} preorderId={payment.preorderId} payment={payment} /></div>
        </details>}
      </>}
    </div>
  );
}
