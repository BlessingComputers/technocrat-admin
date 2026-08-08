"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/shared/app-icon";
import { publicEnv } from "@/config/env";
import { useRegisterMidenWebhook } from "../../api/payments.queries";

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Registers the Miden webhook URL. `baseUrl` is required on the wire (not
 * derived from the request) precisely because `req.protocol` can lie behind a
 * proxy and silently register a broken HTTP URL — a failure mode invisible
 * until payments are mysteriously stuck days later
 * (PAYMENTS-BACKEND-CONTRACT.md §2.7 / BACKEND-CONTRACT-DELTA §3.7). This form
 * enforces HTTPS client-side too, and warns before overwriting a live
 * registration since whether re-registering mid-flight risks dropped events
 * is still an open question.
 */
export function WebhookRegistrationCard() {
  const [baseUrl, setBaseUrl] = useState(publicEnv.backendUrl || "");
  const [confirmed, setConfirmed] = useState(false);
  const mutation = useRegisterMidenWebhook();

  const valid = isHttpsUrl(baseUrl);
  const disabled = !valid || !confirmed || mutation.isPending;

  return (
    <Card className="p-6 border border-border bg-card rounded-xl space-y-5">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <AppIcon icon="solar:link-linear" className="w-4 h-4 text-primary" />
          Miden Webhook
        </h3>
        <p className="text-xs text-muted-foreground mt-2">
          One-time (or occasional, e.g. on domain change) setup. Registers the
          URL Miden delivers card and virtual-account collection events to.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          Public HTTPS Base URL
        </Label>
        <Input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.blessingcomputers.com"
          className="rounded-lg bg-muted/50 border-border font-mono text-xs"
        />
        {baseUrl && !valid && (
          <p className="text-xs text-destructive">
            Must be a valid HTTPS URL. Miden will silently receive nothing if
            this resolves to HTTP.
          </p>
        )}
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        I understand this overwrites the current registration and whether
        re-registering mid-flight risks dropped events is unconfirmed.
      </label>

      <Button
        onClick={() => mutation.mutate(baseUrl)}
        disabled={disabled}
        className="w-full h-11 rounded-lg font-black disabled:opacity-50"
      >
        {mutation.isPending ? "Registering..." : "Register Webhook"}
      </Button>
    </Card>
  );
}
