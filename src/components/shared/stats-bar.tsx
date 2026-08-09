import * as React from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

/**
 * The list-page stats strip.
 *
 * Ticket 07 replaced four separately-floating cards with ONE ruled panel: the
 * readings belong to the same instrument, so they sit on the same surface and
 * are separated by hairlines rather than by gutters. The rules are drawn with
 * the `gap-px` + `bg-border` technique so they stay correct at every
 * breakpoint, including the 2-column wrap where per-cell borders would leave
 * dangling edges.
 *
 * Extracted from four near-identical copies in orders / customers / products /
 * parts. Layout changes belong HERE now, not in a feature slice.
 */

/** Icon-chip tints. Status tones carry meaning; `jewel` is decorative only. */
const STAT_TONE = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
  info: "bg-info/15 text-info",
  jewel: "bg-jewel/15 text-jewel",
  muted: "bg-muted text-muted-foreground",
} as const;

export type StatTone = keyof typeof STAT_TONE;

export function StatsBar({
  children,
  className,
  columns = 4,
}: {
  children: React.ReactNode;
  className?: string;
  /** Cells across at the widest breakpoint. */
  columns?: 2 | 3 | 4 | 5;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden p-0", className)}>
      <div
        className={cn(
          "grid grid-cols-1 gap-px bg-border sm:grid-cols-2",
          columns === 3 && "lg:grid-cols-3",
          columns === 4 && "lg:grid-cols-4",
          columns === 5 && "lg:grid-cols-5",
        )}
      >
        {children}
      </div>
    </Card>
  );
}

export function Stat({
  icon,
  tone = "primary",
  label,
  value,
  badge,
  badgeTone,
  href,
  trend,
  trendDirection,
  description,
  loading,
  footer,
  className,
}: {
  icon: string;
  tone?: StatTone;
  label: string;
  /** Pre-formatted — the caller owns currency/number formatting. */
  value: React.ReactNode;
  /** Optional flag in the top-right, e.g. "Pending". Omit when not needed. */
  badge?: React.ReactNode;
  /** Defaults to the cell's own tone. */
  badgeTone?: StatTone;
  /** Makes the whole cell a link and adds an affordance arrow. */
  href?: string;
  /** Period-over-period delta, e.g. "12%". Needs `trendDirection`. */
  trend?: React.ReactNode;
  /** `up` reads as success, `down` as destructive. */
  trendDirection?: "up" | "down";
  /** One quiet line under the value, e.g. "vs. last 30 days". */
  description?: React.ReactNode;
  /** Renders an em dash placeholder in place of the value. */
  loading?: boolean;
  /**
   * Extra content below the value — e.g. the split ratio bar on the dashboard's
   * KPIs. Keeps richer cells inside the shared panel instead of forking a
   * second card style.
   */
  footer?: React.ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-lg",
            STAT_TONE[tone],
          )}
        >
          <AppIcon icon={icon} className="size-5" />
        </div>
        {href && badge == null && (
          <AppIcon
            icon="solar:arrow-right-up-linear"
            className="size-4 text-muted-foreground"
          />
        )}
        {badge != null && (
          <span
            className={cn(
              "rounded-full px-2 py-1 text-xs font-medium",
              STAT_TONE[badgeTone ?? tone],
            )}
          >
            {badge}
          </span>
        )}
      </div>
      {/* Sentence case, not tracked caps — DESIGN.md's eyebrow rule. New code
          does not add to the debt the FieldLabel sweep exists to clear. */}
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3
          className={cn(
            "text-3xl font-bold tracking-tight text-foreground tabular-nums",
            loading && "animate-pulse text-muted-foreground/30",
          )}
        >
          {loading ? "—" : value}
        </h3>
        {trend != null && !loading && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
              trendDirection === "down"
                ? "bg-destructive/12 text-destructive"
                : "bg-success/15 text-success",
            )}
          >
            <AppIcon
              icon={
                trendDirection === "down"
                  ? "solar:arrow-right-down-linear"
                  : "solar:arrow-right-up-linear"
              }
              className="size-3"
            />
            {trend}
          </span>
        )}
      </div>
      {description != null && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      {footer != null && <div className="mt-3">{footer}</div>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "bg-card p-5 transition-colors hover:bg-muted/40",
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn("bg-card p-5", className)}>{body}</div>;
}
