"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/error-message";
import { useExtendPaymentDeadline } from "../../api/payment-terms.queries";
import type { PreorderPaymentRequest } from "../../types/preorders";
import { validNewDeadline } from "../../utils/payment-changes";
import { formatWestAfricaTime, westAfricaLocalToIso } from "../../utils/payment-terms";

export function PreorderDeadlineForm({ preorderId, payment }: { preorderId: string; payment: PreorderPaymentRequest }) {
  const [payBy, setPayBy] = useState("");
  const [reason, setReason] = useState("");
  const extension = useExtendPaymentDeadline();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validNewDeadline(payBy, payment.payBy)) {
      toast.error("Choose a future deadline later than the current deadline");
      return;
    }
    if (!reason.trim() || extension.isPending) return;
    extension.mutate({ preorderId, requestId: payment.id, input: { payBy: westAfricaLocalToIso(payBy), reason: reason.trim() } }, {
      onSuccess: () => { setPayBy(""); setReason(""); toast.success("Deadline extended. Customer notified in-app."); },
      onError: (error) => toast.error(getErrorMessage(error, "Could not extend the deadline")),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {payment.payBy && <p className="text-sm text-muted-foreground">Current deadline: {formatWestAfricaTime(payment.payBy)}.</p>}
      <div className="space-y-2"><Label htmlFor="extension-deadline">New payment deadline, WAT</Label><Input id="extension-deadline" type="datetime-local" value={payBy} onChange={(event) => setPayBy(event.target.value)} required /><p className="text-xs text-muted-foreground">Must be in the future and later than the current deadline. Extending an expired request reopens payment.</p></div>
      <div className="space-y-2"><Label htmlFor="extension-reason">Reason shown to the customer</Label><Textarea id="extension-reason" maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} required /></div>
      <p className="text-xs text-muted-foreground">The customer receives an in-app notification. No email is sent.</p>
      <Button type="submit" disabled={!payBy || !reason.trim() || extension.isPending}>{extension.isPending ? "Saving..." : "Extend deadline"}</Button>
    </form>
  );
}
