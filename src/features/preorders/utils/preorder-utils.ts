/**
 * Presentation helpers for the pre-orders queue. Tone maps use semantic tokens
 * only, mirroring the customers and orders features (ADR-0009).
 */
import type { Preorder, PreorderStatus } from "../types/preorders";

type Tone = "success" | "info" | "warning" | "danger" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/25",
  info: "bg-info/10 text-info-ink border-info/20",
  warning: "bg-warning/15 text-warning border-warning/25",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  muted: "bg-muted text-muted-foreground border-border",
};

/**
 * Staff-side wording, on purpose.
 *
 * The storefront relabels this same enum from the customer's side of the
 * counter — `CONTACTED` becomes "We have been in touch", `PENDING` becomes
 * "Received" (see `preorder-status.ts` in the customer app). Do NOT mirror
 * those here. This screen is the shop's side: `PENDING` means *we owe someone
 * a call*, and softening it to "Received" would describe the customer's
 * experience of a job that is, to the person reading this table, untouched
 * work. The two vocabularies are meant to differ.
 */
const STATUS_LABELS: Record<PreorderStatus, string> = {
  PENDING: "Pending",
  CONTACTED: "Contacted",
  CONFIRMED: "Confirmed",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
};

/** What the status means as a piece of work, for the detail page. */
const STATUS_HINTS: Record<PreorderStatus, string> = {
  PENDING: "Nobody has reached out yet. This is the queue's actual backlog.",
  CONTACTED: "Someone has spoken to the customer. Sourcing or quoting next.",
  CONFIRMED: "We can source it, and the customer has agreed to go ahead.",
  FULFILLED: "Delivered and closed. No further action.",
  CANCELLED: "Closed without fulfilment. The customer can pre-order again.",
};

/**
 * `PENDING` is warning-toned rather than neutral because on this screen it is
 * the one status that means work is outstanding — a queue that renders its
 * backlog in the same grey as its closed rows is not a queue.
 */
const STATUS_TONES: Record<PreorderStatus, Tone> = {
  PENDING: "warning",
  CONTACTED: "info",
  CONFIRMED: "info",
  FULFILLED: "success",
  CANCELLED: "muted",
};

export function preorderStatusLabel(status?: string): string {
  return STATUS_LABELS[status as PreorderStatus] ?? status ?? "Unknown";
}

export function preorderStatusHint(status?: string): string {
  return STATUS_HINTS[status as PreorderStatus] ?? "";
}

export function preorderStatusClasses(status?: string): string {
  return TONE_CLASSES[STATUS_TONES[status as PreorderStatus] ?? "muted"];
}

/**
 * The one step forward from here, or `null` at a terminal status.
 *
 * The backend enforces no ordering at all — `adminUpdatePreOrderStatus` will
 * write any status over any other. This is the ordering staff actually work,
 * expressed once, so the queue can offer a single obvious primary action per
 * row instead of a five-way dropdown that makes every step feel equally
 * likely. Every other transition stays reachable through the "Change status"
 * menu, including backwards — see `preorderService.updateStatus`.
 */
export function nextStatus(status: PreorderStatus): PreorderStatus | null {
  switch (status) {
    case "PENDING":
      return "CONTACTED";
    case "CONTACTED":
      return "CONFIRMED";
    case "CONFIRMED":
      return "FULFILLED";
    default:
      return null;
  }
}

/** Imperative label for the primary advance action, e.g. "Mark contacted". */
export function advanceLabel(status: PreorderStatus): string | null {
  const next = nextStatus(status);
  return next ? `Mark ${STATUS_LABELS[next].toLowerCase()}` : null;
}

/** `FULFILLED` and `CANCELLED` are ends of the line; moving out of one is a correction. */
export function isTerminal(status: PreorderStatus): boolean {
  return status === "FULFILLED" || status === "CANCELLED";
}

/**
 * Whether moving `from` → `to` deserves a confirmation step.
 *
 * Three cases are worth stopping for: cancelling, closing as fulfilled, and
 * reopening something already closed. The routine forward nudges (pending →
 * contacted, contacted → confirmed) are not — a confirm dialog on the action
 * staff take fifty times a day is a tax, not a safeguard.
 */
export function needsConfirmation(
  from: PreorderStatus,
  to: PreorderStatus,
): boolean {
  return to === "CANCELLED" || to === "FULFILLED" || isTerminal(from);
}

export function preorderCustomerName(preorder: Preorder): string {
  const name = `${preorder.firstName ?? ""} ${preorder.lastName ?? ""}`.trim();
  return name || "Unknown customer";
}

export function preorderInitials(preorder: Preorder): string {
  const first = preorder.firstName?.[0] ?? "";
  const last = preorder.lastName?.[0] ?? "";
  const combined = `${first}${last}`.trim();
  if (combined) return combined.toUpperCase();
  return (preorder.email?.[0] ?? "?").toUpperCase();
}

/** Single-line delivery address, skipping the parts the customer left blank. */
export function preorderAddressLines(preorder: Preorder): string[] {
  return [
    preorder.address,
    [preorder.city, preorder.state].filter(Boolean).join(", "),
    [preorder.postalCode, preorder.country].filter(Boolean).join(" "),
  ]
    .map((line) => line?.trim())
    .filter((line): line is string => !!line);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * "3 days" — how long this pre-order has been sitting.
 *
 * Deliberately unqualified by status: a `PENDING` row aged eleven days is the
 * single most useful fact this table can show, and the caller decides whether
 * to dignify it with emphasis (`isStale`).
 */
export function ageInDays(value?: string | null): number | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

export function formatAge(value?: string | null): string {
  const days = ageInDays(value);
  if (days === null) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

/**
 * An untouched pre-order older than this has been waiting too long. Three days
 * is a judgement call, not a backend rule — response time is the whole product
 * for pre-orders, and a threshold that never fires is decoration.
 */
const STALE_AFTER_DAYS = 3;

export function isStale(preorder: Preorder): boolean {
  if (preorder.status !== "PENDING") return false;
  const days = ageInDays(preorder.createdAt);
  return days !== null && days >= STALE_AFTER_DAYS;
}
