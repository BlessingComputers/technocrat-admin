"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { useCircuitHealth } from "../../api/payments.queries";
import { circuitTone } from "../../utils/payment-utils";

const COPY: Record<string, string> = {
  Closed: "Normal — payments flow through.",
  HalfOpen: "Testing recovery — one request allowed through to probe the gateway.",
  Open: "Gateway errors exceeded threshold — new payment initiations return 503 for about 30s.",
};

/**
 * Read-only circuit-breaker state — "is the payment circuit open" is the
 * first question during an incident, per the backend maintainer's own note
 * (BACKEND-CONTRACT-DELTA §3.5). Polls every 30s via `useCircuitHealth`.
 */
export function CircuitStatusCard() {
  const { data, isLoading } = useCircuitHealth();

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <AppIcon
          icon="solar:pulse-2-linear"
          className="w-4 h-4 text-primary-ink"
        />
        Payment Circuit
      </h3>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Checking...</p>
      ) : (
        <div className="space-y-2">
          <Badge variant={circuitTone(data.circuit)}>
            {data.circuit}
          </Badge>
          <p className="text-sm text-foreground">{COPY[data.circuit]}</p>
        </div>
      )}
    </Card>
  );
}
