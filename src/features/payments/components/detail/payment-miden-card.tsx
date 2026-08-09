"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/shared/app-icon";
import {
  useLookupMidenTransaction,
  useResendMidenWebhook,
} from "../../api/payments.queries";
import type { AdminTransactionDetail } from "../../types/payments";

interface PaymentMidenCardProps {
  payment: AdminTransactionDetail;
}

/**
 * Diagnostic tools for a stuck payment: look up its state directly on Miden
 * (bypasses this app's DB entirely), and force a webhook resend once you have
 * Miden's own numeric transaction id from the lookup result
 * (PAYMENTS-BACKEND-CONTRACT.md §2 — `miden/lookup` and `miden/webhooks/resend`).
 */
export function PaymentMidenCard({ payment }: PaymentMidenCardProps) {
  const [reference, setReference] = useState(
    payment.providerReference || "",
  );
  const [transactionIds, setTransactionIds] = useState("");
  const lookup = useLookupMidenTransaction();
  const resend = useResendMidenWebhook();

  const parsedIds = transactionIds
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  return (
    <Card className="p-6 border bg-card space-y-5">
      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <AppIcon icon="solar:radar-linear" className="w-4 h-4 text-primary" />
        Miden Tools
      </h3>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          Live lookup by reference
        </Label>
        <div className="flex gap-2">
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Miden reference, not providerReference"
            className="rounded-lg bg-muted/50 border-border font-mono text-xs"
          />
          <Button
            variant="outline"
            disabled={!reference || lookup.isPending}
            onClick={() => lookup.mutate(reference)}
            className="shrink-0"
          >
            {lookup.isPending ? "Looking up..." : "Lookup"}
          </Button>
        </div>
        {lookup.data && (
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 text-[11px] font-mono text-foreground">
            {JSON.stringify(lookup.data, null, 2)}
          </pre>
        )}
      </div>

      <div className="border-t border-border/60 pt-5 space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          Resend webhook (Miden numeric transaction id, comma-separated)
        </Label>
        <div className="flex gap-2">
          <Input
            value={transactionIds}
            onChange={(e) => setTransactionIds(e.target.value)}
            placeholder="516871, 509754"
            className="rounded-lg bg-muted/50 border-border font-mono text-xs"
          />
          <Button
            variant="outline"
            disabled={parsedIds.length === 0 || resend.isPending}
            onClick={() => resend.mutate(parsedIds)}
            className="shrink-0"
          >
            {resend.isPending ? "Sending..." : "Resend"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Safe to call twice for the same transaction (deduped on delivery).
          Requires Miden&apos;s own id, not this app&apos;s payment or
          provider reference.
        </p>
      </div>
    </Card>
  );
}
