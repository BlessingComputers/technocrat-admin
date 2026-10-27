import { Card } from "@/components/ui/card";
import { MetaLabel } from "@/components/shared/meta-label";
import type { PreorderPaymentSummary as PaymentSummary } from "../../types/preorders";
import {
  formatNaira,
  formatWestAfricaTime,
} from "../../utils/payment-terms";
import { paymentStatusLabel } from "../../utils/preorder-payment";
import { PreorderPaymentEvidenceReview } from "./preorder-payment-evidence-review";

export function PreorderPaymentSummary({
  summary,
  editable = true,
}: {
  summary: PaymentSummary;
  editable?: boolean;
}) {
  const request = summary.firstPayment;
  const account = request.bankAccountSnapshot;
  const isFullPayment = summary.plan === "FULL_PAYMENT";

  return (
    <Card className="space-y-6 p-8">
      <div>
        <MetaLabel>Saved payment terms</MetaLabel>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          {isFullPayment ? "Full payment" : "Commitment fee"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {paymentStatusLabel(request.status)} · {formatNaira(request.amount)}
          {request.payBy
            ? ` · deadline ${formatWestAfricaTime(request.payBy)}`
            : " with no fixed deadline"}
        </p>
      </div>

      <dl className="grid gap-5 border-t border-border pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Agreed total</dt>
          <dd className="mt-1 font-semibold">{formatNaira(summary.totalAmount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            {isFullPayment ? "Payment" : `Commitment fee (${request.percentage}%)`}
          </dt>
          <dd className="mt-1 font-semibold">{formatNaira(request.amount)}</dd>
        </div>
        {!isFullPayment && (
          <div>
            <dt className="text-xs text-muted-foreground">Amount still unpaid</dt>
            <dd className="mt-1 font-semibold">{formatNaira(summary.amountDue)}</dd>
          </div>
        )}
      </dl>

      {account && (
        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <p className="font-medium text-foreground">{account.bankName}</p>
          <p className="mt-1 text-muted-foreground">
            {account.accountName} · {account.accountNumber}
          </p>
        </div>
      )}

      <PreorderPaymentEvidenceReview
        preorderId={request.preorderId}
        payment={request}
        allowReview={editable}
      />
    </Card>
  );
}
