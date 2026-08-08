/**
 * Status → tone mapping for payment/DLQ/reconcile badges (ADR-0009). Tones map
 * 1:1 onto the shared `<Badge>` variants — see orders/utils/order-utils.ts for
 * the sibling convention this mirrors.
 */
type StatusTone = "success" | "info" | "warning" | "danger" | "muted";

export function paymentStatusTone(status: string): StatusTone {
  switch (status?.toUpperCase()) {
    case "PAID":
      return "success";
    case "REFUNDED":
      return "info";
    case "FAILED":
      return "danger";
    case "PENDING":
    default:
      return "warning";
  }
}

export function dlqJobTypeTone(type: string): StatusTone {
  switch (type?.toUpperCase()) {
    case "VERIFY":
      return "info";
    case "WEBHOOK":
      return "warning";
    case "NOTIFY":
      return "muted";
    default:
      return "muted";
  }
}

/**
 * `lastReconcileOutcome` — RESOLVED = payment left PENDING as a result;
 * STILL_PENDING = re-verified, still stuck; ERROR = the re-verify call itself
 * threw; NO_REFERENCE = no providerReference to look up by. Distinguishing
 * these is the whole point of the field (BACKEND-CONTRACT-DELTA §3.6).
 */
export function reconcileOutcomeTone(
  outcome: string | null | undefined,
): StatusTone {
  switch (outcome) {
    case "RESOLVED":
      return "success";
    case "STILL_PENDING":
      return "warning";
    case "ERROR":
      return "danger";
    case "NO_REFERENCE":
      return "muted";
    default:
      return "muted";
  }
}

export function circuitTone(
  circuit: "Closed" | "Open" | "HalfOpen",
): StatusTone {
  switch (circuit) {
    case "Closed":
      return "success";
    case "HalfOpen":
      return "warning";
    case "Open":
      return "danger";
  }
}

/**
 * Miden's OWN reference for a transaction — distinct from this app's
 * `providerReference` and not recognized by Miden's API at all. Present as
 * `.reference` from initiate time, or `.merchantReference`/
 * `.transactionReference` once the payment is matched against Miden's
 * Get Collections records. This is the value to pass to
 * `GET /payments/miden/lookup/{reference}` (see CONTRACT.md).
 */
export function getMidenReference(gatewayResponse: unknown): string | null {
  if (!gatewayResponse || typeof gatewayResponse !== "object") return null;
  const r = gatewayResponse as Record<string, unknown>;
  const value = r.reference ?? r.merchantReference ?? r.transactionReference;
  return typeof value === "string" && value.length > 0 ? value : null;
}
