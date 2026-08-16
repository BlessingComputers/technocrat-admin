/**
 * Presentation helpers for the customers feature. Tone maps mirror the orders
 * feature's semantic-token approach (ADR-0009) — no hardcoded palette colors.
 */
import type { Customer } from "../types/customers";

type Tone = "success" | "info" | "warning" | "danger" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/25",
  info: "bg-info/10 text-info-ink border-info/20",
  warning: "bg-warning/15 text-warning border-warning/25",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  muted: "bg-muted text-muted-foreground border-border",
};

export function customerStatusTone(status?: string): Tone {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "warning";
    case "DELETED":
      return "danger";
    default:
      return "muted";
  }
}

export function customerStatusClasses(status?: string): string {
  return TONE_CLASSES[customerStatusTone(status)];
}

/**
 * Loyalty tiers are METALS, not statuses.
 *
 * They used to borrow the status tones — which meant BRONZE rendered in
 * `danger` red, GOLD in warning amber and PLATINUM in info blue: a customer's
 * standing looked like an alert. Each tier now uses its own `--tier-*` token
 * so the medal reads as the metal it is. Unknown tiers still fall back to the
 * neutral status tone, because an unrecognised tier is genuinely "no tier".
 */
type TierTone = "bronze" | "silver" | "gold" | "platinum";

const TIER_CLASSES: Record<TierTone, string> = {
  bronze: "bg-tier-bronze/15 text-tier-bronze-ink border-tier-bronze/30",
  silver: "bg-tier-silver/15 text-tier-silver-ink border-tier-silver/30",
  gold: "bg-tier-gold/15 text-tier-gold-ink border-tier-gold/30",
  platinum:
    "bg-tier-platinum/15 text-tier-platinum-ink border-tier-platinum/30",
};

export function loyaltyTierTone(tier?: string): TierTone | null {
  switch (tier?.toUpperCase()) {
    case "PLATINUM":
      return "platinum";
    case "GOLD":
      return "gold";
    case "SILVER":
      return "silver";
    case "BRONZE":
      return "bronze";
    default:
      return null;
  }
}

export function loyaltyTierClasses(tier?: string): string {
  const tone = loyaltyTierTone(tier);
  return tone ? TIER_CLASSES[tone] : TONE_CLASSES.muted;
}

export function invoiceStatusTone(status?: string): Tone {
  switch (status?.toUpperCase()) {
    case "PAID":
    case "APPROVED":
      return "success";
    case "PARTIALLY_APPROVED":
      return "warning";
    case "ISSUED":
      return "info";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    case "DRAFT":
    default:
      return "muted";
  }
}

export function invoiceStatusClasses(status?: string): string {
  return TONE_CLASSES[invoiceStatusTone(status)];
}

export function fullName(customer: {
  firstName?: string;
  lastName?: string;
}): string {
  const name = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  return name || "Unknown Customer";
}

export function initials(customer: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  const first = customer.firstName?.[0] ?? "";
  const last = customer.lastName?.[0] ?? "";
  const combined = `${first}${last}`.trim();
  if (combined) return combined.toUpperCase();
  return (customer.email?.[0] ?? "?").toUpperCase();
}

/** Coerce the wire's string-or-number money field to a number for formatPrice. */
export function toAmount(value?: string | number | null): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
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

export function customerLifetimeValue(customer: Customer): number {
  return toAmount(customer.totalSpent);
}
