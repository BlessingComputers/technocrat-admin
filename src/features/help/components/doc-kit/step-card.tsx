import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { BentoTile } from "./bento";

/**
 * A single numbered step **card** for the bento step mosaic (ADR-0012). Unlike
 * {@link Steps} — a vertical numbered spine for dense follow-along procedures —
 * a `StepCard` is one tile in a {@link Bento} grid: the number sits in a
 * rounded-tile badge *inside* the card (not on a spine), above a title and body.
 * Mixed `span`/`tone` across sibling cards is what makes an overview read as a
 * composed page rather than a bulleted list.
 *
 * Compose them inside `<Bento>`; give each a `span` and pick one focal `tone`
 * (`inverted`/`jewel`) per mosaic to hold the Green-Owns-Action / jewel-as-edge
 * rules (DESIGN.md). `bgIcon` drops the giant faded corner glyph of the tile.
 */
export function StepCard({
  n,
  title,
  span = 6,
  tone = "muted",
  bgIcon,
  children,
}: {
  /** Step number shown in the badge. */
  n: number;
  title: string;
  span?: 4 | 5 | 6 | 7 | 8 | 12;
  tone?: "muted" | "card" | "accent" | "jewel" | "inverted" | "dark";
  /** Iconify Solar name for the giant faded corner glyph. */
  bgIcon?: string;
  children: ReactNode;
}) {
  const dark = tone === "inverted" || tone === "dark";
  return (
    <BentoTile span={span} tone={tone} bgIcon={bgIcon}>
      <div
        className={cn(
          "mb-4 flex size-11 items-center justify-center rounded-xl text-base font-black tabular-nums",
          tone === "jewel"
            ? "bg-jewel/15 text-jewel"
            : dark
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-primary/10 text-primary",
        )}
      >
        {String(n).padStart(2, "0")}
      </div>
      <h3
        className={cn(
          "text-base font-black tracking-tight",
          dark ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {title}
      </h3>
      <div
        className={cn(
          "mt-2 space-y-3 text-sm leading-relaxed [&_b]:font-bold",
          dark
            ? "text-primary-foreground/80 [&_b]:text-primary-foreground"
            : "text-muted-foreground [&_b]:text-foreground",
        )}
      >
        {children}
      </div>
    </BentoTile>
  );
}

/**
 * A terse, icon-led feature/point row for use inside a {@link StepCard} (the
 * ADR-0012 "feature list" on the inverted step card). Tone-aware so it reads on
 * both light and inverted surfaces.
 */
export function StepPoint({
  icon = "solar:check-circle-linear",
  dark,
  children,
}: {
  icon?: string;
  /** Set on inverted/dark cards so the glyph and text stay legible. */
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <AppIcon
        icon={icon}
        aria-hidden
        className={cn(
          "mt-0.5 size-4 shrink-0",
          dark ? "text-primary-foreground/70" : "text-primary",
        )}
      />
      <span>{children}</span>
    </li>
  );
}
