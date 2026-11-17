"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRecordRefund } from "../../api/payments.queries";
import type { AdminTransactionDetail } from "../../types/payments";

/** Where staff send the money: the gateway that took the payment. */
function providerDashboard(provider: string): string {
  if (provider === "miden") return "Miden dashboard";
  if (provider === "paystack") return "Paystack dashboard";
  return "payment provider's dashboard";
}

interface PaymentRefundDialogProps {
  payment: AdminTransactionDetail;
}

/**
 * Records a refund that was already processed manually (bank/Miden/Paystack
 * dashboard) — this endpoint does NOT trigger a bank refund itself
 * (PAYMENTS-BACKEND-CONTRACT.md §2, `POST /payments/refund`). Amount is
 * optional (omit = full remaining balance); `idempotencyKey` is generated
 * per submission so a double-click can't double-record.
 */
export function PaymentRefundDialog({ payment }: PaymentRefundDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("bank_transfer");
  const mutation = useRecordRefund();

  const disabled = mutation.isPending || reason.trim().length < 5;

  const submit = () => {
    mutation.mutate(
      {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: amount ? Number(amount) : undefined,
        reason: reason.trim(),
        refundMethod,
        idempotencyKey: `refund-${payment.paymentId}-${Date.now()}`,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setAmount("");
          setReason("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-10 px-4 rounded-lg font-medium text-xs"
        >
          <AppIcon icon="solar:card-recive-linear" className="w-3 h-3 mr-2" />
          Record Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-xl p-8 border border-border">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-semibold text-foreground">
            Record Refund
          </DialogTitle>
        </DialogHeader>
        <Alert className="mb-6 border-warning/30 bg-warning/10">
          <AppIcon
            icon="solar:danger-triangle-linear"
            className="size-4 text-warning-ink"
          />
          <AlertTitle className="text-sm font-semibold">
            This does not send money to the customer
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Send the refund first, outside this app: through the{" "}
            {providerDashboard(payment.provider)}, or by bank transfer from
            the company account. Then record it here. Saving tells the
            customer that the refund is done.
          </AlertDescription>
        </Alert>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground ml-1">
              Amount (leave blank for full remaining balance)
            </Label>
            <Input
              type="number"
              min={0}
              placeholder={String(payment.amount)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg bg-muted/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground ml-1">
              Refund Method
            </Label>
            <Input
              placeholder="bank_transfer, cash, miden_dashboard..."
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="rounded-lg bg-muted/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground ml-1">
              Reason
            </Label>
            <Textarea
              placeholder="e.g. Customer returned the item in good condition"
              className="rounded-lg bg-muted/50 border-border min-h-[90px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button
            onClick={submit}
            disabled={disabled}
            className="w-full h-12 rounded-lg font-medium disabled:opacity-50"
          >
            {mutation.isPending ? "Recording..." : "Record Refund"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
