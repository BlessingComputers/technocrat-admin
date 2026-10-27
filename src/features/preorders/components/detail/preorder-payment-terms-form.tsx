"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  useIssuePreorderPaymentTerms,
  usePreorderReceivingAccounts,
} from "../../api/preorder.queries";
import type { Preorder } from "../../types/preorders";
import {
  calculatePaymentPreview,
  defaultPaymentDeadline,
  formatNaira,
  formatWestAfricaTime,
  toDateTimeLocalValue,
  westAfricaLocalToIso,
} from "../../utils/payment-terms";

export function PreorderPaymentTermsForm({ preorder }: { preorder: Preorder }) {
  const [totalAmount, setTotalAmount] = useState("");
  const [percentage, setPercentage] = useState("30");
  const [payBy, setPayBy] = useState(() =>
    toDateTimeLocalValue(defaultPaymentDeadline()),
  );
  const [minimumPayBy] = useState(() => toDateTimeLocalValue(new Date()));
  const accounts = usePreorderReceivingAccounts();
  const issueTerms = useIssuePreorderPaymentTerms();
  const primaryAccount = accounts.data?.find(
    (account) => account.isActive && account.isPrimary && account.currency === "NGN",
  );
  const total = Number(totalAmount);
  const percent = Number(percentage);
  const preview = useMemo(
    () => calculatePaymentPreview(total || 0, percent || 0),
    [percent, total],
  );
  const isValid =
    total > 0 &&
    percent > 0 &&
    percent <= 100 &&
    payBy !== "" &&
    payBy > minimumPayBy;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!primaryAccount || !isValid) return;

    issueTerms.mutate(
      {
        id: preorder.id,
        input: {
          totalAmount: total,
          firstPaymentPercentage: percent,
          currency: "NGN",
          payBy: westAfricaLocalToIso(payBy),
        },
      },
      {
        onSuccess: () => toast.success("Payment terms sent to the customer"),
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not issue payment terms")),
      },
    );
  }

  return (
    <Card className="p-8">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold">Issue payment terms</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Confirm the agreed price and first payment. Sending this request confirms
          the preorder and gives the customer the saved bank details.
        </p>
      </div>

      {!accounts.isLoading && !primaryAccount && (
        <div className="mt-6 flex gap-3 rounded-lg border border-warning/25 bg-warning/10 p-4">
          <AppIcon icon="solar:danger-triangle-linear" className="mt-0.5 size-5 shrink-0 text-warning-ink" />
          <div className="text-sm">
            <p className="font-medium text-foreground">No active primary NGN account</p>
            <p className="mt-1 text-muted-foreground">
              Add or choose the account customers should pay before issuing terms.
            </p>
            <Link href="/payments/bank-accounts" className="mt-2 inline-block font-medium text-primary-ink hover:underline">
              Open Bank Accounts
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="preorder-total">Agreed total price</Label>
            <Input id="preorder-total" type="number" min="1" step="0.01" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} placeholder="500000" required />
            <p className="text-xs text-muted-foreground">Nigerian naira</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preorder-percentage">First payment percentage</Label>
            <Input id="preorder-percentage" type="number" min="1" max="100" step="1" value={percentage} onChange={(event) => setPercentage(event.target.value)} required />
            <p className="text-xs text-muted-foreground">Use 100% when the customer will pay in full.</p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="preorder-pay-by">Pay by</Label>
            <Input id="preorder-pay-by" type="datetime-local" min={minimumPayBy} value={payBy} onChange={(event) => setPayBy(event.target.value)} required />
            <p className="text-xs text-muted-foreground">
              Defaults to 72 hours. Exact deadline: {payBy ? formatWestAfricaTime(westAfricaLocalToIso(payBy)) : "Choose a date and time"}.
            </p>
          </div>
        </div>

        {total > 0 && percent > 0 && percent <= 100 && (
          <div className="rounded-lg border border-border bg-muted/40 p-5">
            <p className="text-xs font-medium text-muted-foreground">Preview only · saved values come from the server</p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div><dt className="text-xs text-muted-foreground">Agreed total</dt><dd className="mt-1 font-semibold">{formatNaira(total)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{preview.isFullPayment ? "Full payment" : "Commitment fee"}</dt><dd className="mt-1 font-semibold">{formatNaira(preview.firstPaymentAmount)}</dd></div>
              {!preview.isFullPayment && <div><dt className="text-xs text-muted-foreground">Remaining balance</dt><dd className="mt-1 font-semibold">{formatNaira(preview.balanceAmount)}</dd></div>}
            </dl>
          </div>
        )}

        <Button type="submit" disabled={!primaryAccount || !isValid || issueTerms.isPending || accounts.isLoading} className="disabled:cursor-not-allowed">
          {issueTerms.isPending ? "Sending terms…" : "Confirm price and request payment"}
        </Button>
      </form>
    </Card>
  );
}
