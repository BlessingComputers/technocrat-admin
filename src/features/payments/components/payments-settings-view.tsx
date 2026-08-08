"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PaymentsAccessGate } from "./payments-access-gate";
import { PaymentsNavTabs } from "./payments-nav-tabs";
import { WebhookRegistrationCard } from "./settings/webhook-registration-card";
import { CircuitStatusCard } from "./settings/circuit-status-card";

/**
 * Payments settings (route `/payments/settings`) — webhook registration and
 * circuit-breaker state. Low-traffic, deliberately unglamorous
 * (PAYMENTS-BACKEND-CONTRACT.md §3).
 */
export function PaymentsSettingsView() {
  return (
    <PaymentsAccessGate>
      <div className="space-y-8">
        <PageHeader
          title="Payment Settings"
          description="Webhook registration and gateway health"
        />

        <PaymentsNavTabs />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <WebhookRegistrationCard />
          <CircuitStatusCard />
        </div>
      </div>
    </PaymentsAccessGate>
  );
}
