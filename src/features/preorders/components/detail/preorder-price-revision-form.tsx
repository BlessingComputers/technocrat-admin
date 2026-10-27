"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/error-message";
import { useRevisePaymentTerms } from "../../api/payment-terms.queries";
import type { PreorderPaymentSummary } from "../../types/preorders";
import { validNewDeadline } from "../../utils/payment-changes";
import { calculatePaymentPreview, formatNaira, westAfricaLocalToIso } from "../../utils/payment-terms";

export function PreorderPriceRevisionForm({ preorderId, summary }: { preorderId: string; summary: PreorderPaymentSummary }) {
  const [total, setTotal] = useState(String(summary.totalAmount));
  const [percentage, setPercentage] = useState(String(summary.firstPayment.percentage));
  const [payBy, setPayBy] = useState("");
  const [reason, setReason] = useState("");
  const revision = useRevisePaymentTerms();
  const amount = Number(total);
  const percent = Number(percentage);
  const validTerms = Number.isFinite(amount) && amount > 0 && Number.isFinite(percent) && percent >= 1 && percent <= 100;
  const validReason = reason.trim().length >= 10 && reason.trim().length <= 300;
  const preview = calculatePaymentPreview(amount, percent);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validNewDeadline(payBy, null)) {
      toast.error("Choose a future payment deadline");
      return;
    }
    if (!validTerms || !validReason || revision.isPending) return;
    revision.mutate({ preorderId, input: { totalAmount: amount, firstPaymentPercentage: percent, payBy: westAfricaLocalToIso(payBy), reason: reason.trim() } }, {
      onSuccess: () => toast.success("Revised terms sent to the customer"),
      onError: (error) => toast.error(getErrorMessage(error, "Could not revise payment terms")),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Current total: {formatNaira(summary.totalAmount)}. Current first payment: {formatNaira(summary.firstPayment.amount)}. The customer will receive the new terms and your reason.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="revision-total">New total price in NGN</Label><Input id="revision-total" type="number" min="0.01" step="0.01" value={total} onChange={(event) => setTotal(event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="revision-percentage">First payment percentage</Label><Input id="revision-percentage" type="number" min="1" max="100" step="any" value={percentage} onChange={(event) => setPercentage(event.target.value)} required /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="revision-deadline">New payment deadline, WAT</Label><Input id="revision-deadline" type="datetime-local" value={payBy} onChange={(event) => setPayBy(event.target.value)} required /><p className="text-xs text-muted-foreground">Choose a future date and time.</p></div>
      <div className="space-y-2"><Label htmlFor="revision-reason">Reason shown to the customer</Label><Textarea id="revision-reason" minLength={10} maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} required /><p className="text-xs text-muted-foreground">10 to 300 characters.</p></div>
      {validTerms && <p className="text-sm">New {preview.isFullPayment ? "full payment" : "commitment fee"}: {formatNaira(preview.firstPaymentAmount)}. Remaining balance: {formatNaira(preview.balanceAmount)}.</p>}
      <Button type="submit" disabled={!validTerms || !validReason || !payBy || revision.isPending}>{revision.isPending ? "Saving..." : "Revise price and notify customer"}</Button>
    </form>
  );
}
