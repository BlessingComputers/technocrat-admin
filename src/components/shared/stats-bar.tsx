import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";

const STAT_TONE = {
  primary: "bg-primary/10 text-primary-ink",
  success: "bg-success/15 text-success-ink",
  warning: "bg-warning/15 text-warning-ink",
  danger: "bg-destructive/12 text-destructive-ink",
  info: "bg-info/15 text-info-ink",
  gold: "bg-gold/15 text-gold-ink",
  jewel: "bg-gold/15 text-gold-ink",
  muted: "bg-muted text-muted-foreground",
} as const;

export type StatTone = keyof typeof STAT_TONE;

export function StatsBar({ children, className, columns = 4 }: { children: React.ReactNode; className?: string; columns?: 2 | 3 | 4 | 5 }) {
  return <Card className={cn("gap-0 overflow-hidden p-0", className)}><div className={cn("grid grid-cols-1 gap-px bg-border sm:grid-cols-2", columns === 3 && "lg:grid-cols-3", columns === 4 && "lg:grid-cols-4", columns === 5 && "lg:grid-cols-5")}>{children}</div></Card>;
}

export function Stat({ icon, tone = "primary", label, value, badge, badgeTone, href, trend, trendDirection, description, loading, footer, className }: { icon: string; tone?: StatTone; label: string; value: React.ReactNode; badge?: React.ReactNode; badgeTone?: StatTone; href?: string; trend?: React.ReactNode; trendDirection?: "up" | "down"; description?: React.ReactNode; loading?: boolean; footer?: React.ReactNode; className?: string }) {
  const body = <><div className="mb-4 flex items-start justify-between gap-3"><div className={cn("flex size-11 items-center justify-center rounded-lg", STAT_TONE[tone])}><AppIcon icon={icon} className="size-5" /></div>{href && badge == null && <AppIcon icon="solar:arrow-right-up-linear" className="size-4 text-muted-foreground" />}{badge != null && <span className={cn("rounded-full px-2 py-1 text-xs font-medium", STAT_TONE[badgeTone ?? tone])}>{badge}</span>}</div><MetaLabel className="mb-1 block">{label}</MetaLabel><div className="flex items-baseline gap-2"><h3 className={cn("text-3xl font-semibold tracking-tight text-foreground tabular-nums", loading && "animate-pulse text-muted-foreground/30")}>{loading ? "—" : value}</h3>{trend != null && !loading && <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium", trendDirection === "down" ? "bg-destructive/12 text-destructive-ink" : "bg-success/15 text-success-ink")}><AppIcon icon={trendDirection === "down" ? "solar:arrow-right-down-linear" : "solar:arrow-right-up-linear"} className="size-3" />{trend}</span>}</div>{description != null && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}{footer != null && <div className="mt-3">{footer}</div>}</>;
  return href ? <Link href={href} className={cn("bg-card p-5 transition-colors hover:bg-muted/40", className)}>{body}</Link> : <div className={cn("bg-card p-5", className)}>{body}</div>;
}
