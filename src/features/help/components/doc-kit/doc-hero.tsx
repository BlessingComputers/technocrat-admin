import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { Eyebrow } from "./eyebrow";

/**
 * The welcoming hub/landing hero: a maroon-tinted panel (no stock photo) with an
 * optional eyebrow, a capped-but-generous heading, a lead, and a slot below for a
 * search field or CTA. Pass `aside` to split it — content on the left, an inverted
 * panel on the right (the hub's at-a-glance deck) — which fills the full width on
 * large screens and stacks on small ones.
 *
 * Heading tops out near the display scale per the ADR-0011 guardrails — bolder
 * than the app's page titles (this is a reading surface) but no `9xl`, no gradient
 * text. A large faint corner glyph adds depth without noise.
 */
export function DocHero({
  eyebrow,
  title,
  lead,
  bgIcon,
  aside,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Iconify Solar name for the giant faded corner glyph (single-column only). */
  bgIcon?: string;
  /** Right-hand inverted panel; when set, the hero becomes a split composition. */
  aside?: ReactNode;
  /** Search field, CTA, or anything anchored beneath the lead. */
  children?: ReactNode;
  className?: string;
}) {
  const content = (
    <div className={cn("relative", aside ? "max-w-2xl" : "max-w-3xl")}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h1 className="text-pretty text-3xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      {lead && (
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {lead}
        </p>
      )}
      {children && <div className="mt-7">{children}</div>}
    </div>
  );

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/12 via-card to-card p-8 sm:p-10 lg:p-12",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      {!aside && bgIcon && (
        <AppIcon
          icon={bgIcon}
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-8 size-72 text-primary-ink/[0.06]"
        />
      )}

      {aside ? (
        <div className="relative grid items-stretch gap-8 lg:grid-cols-12">
          <div className="flex items-center lg:col-span-7">{content}</div>
          <div className="lg:col-span-5">{aside}</div>
        </div>
      ) : (
        content
      )}
    </section>
  );
}
