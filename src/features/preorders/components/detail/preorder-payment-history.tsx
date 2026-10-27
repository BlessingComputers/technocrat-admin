"use client";

import { Card } from "@/components/ui/card";
import { usePreorderPaymentHistory } from "../../api/preorder.queries";
import { formatNaira, formatWestAfricaTime } from "../../utils/payment-terms";

export function PreorderPaymentHistory({ preorderId }: { preorderId: string }) {
  const history = usePreorderPaymentHistory(preorderId);
  if (history.isLoading) return <Card className="h-32 animate-pulse p-8" />;
  if (history.isError) {
    return (
      <Card className="p-8 text-sm text-destructive-ink">
        Payment history could not be loaded. Refresh the page to try again.
      </Card>
    );
  }
  if (!history.data?.length) return null;

  return (
    <Card className="space-y-6 p-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Payment history</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every receipt and decision is retained.</p>
      </div>
      <ol className="space-y-6">
        {history.data.map((request) => (
          <li key={request.id} className="border-t border-border pt-5 first:border-0 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-foreground">{request.stage === "FIRST_PAYMENT" ? "First payment" : "Balance"} · {formatNaira(request.amount)}</p>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{request.status.replaceAll("_", " ").toLowerCase()}</span>
            </div>
            <ol className="mt-3 space-y-3">
              <li className="text-sm text-muted-foreground">
                {request.isSuperseded && <p className="font-medium">Replaced by revised terms. Do not collect this amount.</p>}
                {request.totalAmount != null && <p>Total price: {formatNaira(request.totalAmount)}. {request.stage === "FIRST_PAYMENT" ? "First payment" : "Balance"}: {request.percentage}%.</p>}
                {request.collectedAt && <p>Collected at handoff: {formatWestAfricaTime(request.collectedAt)}. Staff: {request.collectedByStaffId ?? "not recorded"}. Method: {request.collectedPaymentMethod ?? "not recorded"}{request.collectedTransactionReference ? `. Reference: ${request.collectedTransactionReference}` : ""}.</p>}
                {request.payBy && <p>Deadline: {formatWestAfricaTime(request.payBy)}</p>}
                {request.revisionReason && <p>Revision reason: {request.revisionReason}</p>}
              </li>
              {[...(request.evidence ?? [])].reverse().map((evidence) => (
                <li key={evidence.id} className="text-sm text-muted-foreground">
                  <p>{formatWestAfricaTime(evidence.submittedAt)} · {evidence.transactionReference}</p>
                  <p className="mt-1">{evidence.decision.toLowerCase()}{evidence.decisionReason ? `: ${evidence.decisionReason}` : ""}</p>
                  {evidence.customerNote && (
                    <p className="mt-1">Customer note: {evidence.customerNote}</p>
                  )}
                  <a href={evidence.fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-medium text-primary-ink hover:underline">Open this receipt</a>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </Card>
  );
}
