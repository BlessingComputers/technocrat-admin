/**
 * Status → tone mapping for monitor badges (ADR-0009), mirroring
 * `payments/utils/payment-utils.ts`'s convention.
 */
type StatusTone = "success" | "info" | "warning" | "danger" | "muted";

export function httpStatusTone(statusCode: number): StatusTone {
  if (statusCode >= 500) return "danger";
  if (statusCode >= 400) return "warning";
  if (statusCode >= 300) return "info";
  if (statusCode >= 200) return "success";
  return "muted";
}

export function anomalyTypeTone(
  type: "error_rate_spike" | "latency_spike",
): StatusTone {
  return type === "error_rate_spike" ? "danger" : "warning";
}

export function anomalyTypeLabel(
  type: "error_rate_spike" | "latency_spike",
): string {
  return type === "error_rate_spike" ? "Error rate spike" : "Latency spike";
}

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

export function formatLogTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, DATE_OPTS);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
