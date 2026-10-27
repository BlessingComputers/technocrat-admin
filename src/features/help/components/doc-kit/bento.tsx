import type { ReactNode } from "react";
import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

/**
 * The asymmetric 12-column mosaic that anchors hub and guide landings (ADR-0011).
 * Deliberately *not* a uniform grid: children are `BentoTile`s of mixed `span`
 * and `tone`, which is what makes the layout read as composed rather than a
 * card-grid dashboard. One column on small screens; 12 from `md` up.
 */
export function Bento({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-12", className)}>
      {children}
    </div>
  );
}

/** md-and-up column spans. Full class strings so Tailwind keeps them (no
 *  dynamic `col-span-${n}`, which the JIT can't see). */
const SPAN = {
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  12: "md:col-span-12",
} as const;

const TONE = {
  muted: "border border-border/60 bg-muted/40 text-card-foreground",
  card: "border border-border/60 bg-card text-card-foreground shadow-soft",
  accent: "border border-primary/30 bg-primary/5 text-card-foreground",
  // Jewel is an accent EDGE (border + glyph), never a jewel surface. Carried
  // over from Blessing's Gold-As-Jewel rule with the hue swapped to periwinkle
  // (ticket 07) — a white card with a coloured edge.
  jewel: "border border-jewel/45 bg-card text-card-foreground shadow-soft",
  // Inverted brand — reserve for one focal surface per view (green-owns-action).
  inverted: "border border-primary bg-primary text-primary-foreground",
  // Inverted navy — the grounding dark surface where maroon would over-claim.
  dark: "border border-secondary bg-secondary text-secondary-foreground",
} as const;

const HOVER = {
  muted: "hover:border-primary/40 hover:bg-muted/60",
  card: "hover:border-primary/40 hover:bg-muted/20",
  accent: "hover:border-primary/50 hover:bg-primary/10",
  jewel: "hover:border-jewel/70 hover:bg-jewel/5",
  inverted: "hover:brightness-110",
  dark: "hover:brightness-125",
} as const;

/** Faded corner-glyph tint per tone — bolder than a hairline wash so it reads. */
const GLYPH_TINT = {
  muted: "text-primary-ink/[0.07]",
  card: "text-primary-ink/[0.07]",
  accent: "text-primary-ink/[0.09]",
  jewel: "text-jewel-ink/[0.12]",
  inverted: "text-primary-foreground/10",
  dark: "text-secondary-foreground/10",
} as const;

/**
 * One tile in the {@link Bento} mosaic. `tone` picks the treatment (muted /
 * elevated card / accent-bordered / inverted maroon); `span` its width; `bgIcon`
 * drops a giant faded Solar glyph bleeding off the bottom-right corner. Pass
 * `href` to make the whole tile a link (with a subtle hover), otherwise it's a
 * plain container.
 */
export function BentoTile({
  span = 6,
  tone = "muted",
  bgIcon,
  href,
  className,
  children,
}: {
  span?: keyof typeof SPAN;
  tone?: keyof typeof TONE;
  /** Iconify Solar name for the giant faded corner glyph. */
  bgIcon?: string;
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  const body = (
    <>
      {bgIcon && (
        <AppIcon
          icon={bgIcon}
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-8 -right-6 size-56",
            GLYPH_TINT[tone],
          )}
        />
      )}
      <div className="relative flex h-full flex-col">{children}</div>
    </>
  );

  const base = cn(
    "relative flex h-full flex-col overflow-hidden rounded-2xl p-6 sm:p-8",
    SPAN[span],
    TONE[tone],
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "group transition-colors motion-reduce:transition-none",
          HOVER[tone],
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={base}>{body}</div>;
}
