import { Stat, type StatTone } from "@/components/shared/stats-bar";

interface InvoiceKpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  tone?: StatTone;
  note?: string;
  isLoading?: boolean;
  /** When set, the whole cell links here. */
  href?: string;
}

/**
 * Invoice KPI cell — a thin wrapper over the shared `<Stat>` (ticket 07 made
 * `<StatsBar>` the default KPI look app-wide). Render inside a `<StatsBar>`.
 *
 * Replaces a bespoke card that carried `hover:-lg` — not a real Tailwind class,
 * so its hover state had never done anything.
 *
 * `iconClassName`/`noteClassName` are gone: colour now comes from `tone`, so a
 * caller can't put an off-system hue on a KPI.
 */
export function InvoiceKpiCard({
  title,
  value,
  icon,
  tone = "primary",
  note,
  isLoading,
  href,
}: InvoiceKpiCardProps) {
  return (
    <Stat
      icon={icon}
      tone={tone}
      label={title}
      value={value}
      description={note}
      loading={isLoading}
      href={href}
    />
  );
}
