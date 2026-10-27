import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";

/**
 * A titled section within a guide: icon chip + heading (+ optional subtitle) and
 * a prose body. The `[&_b]` rules give inline <b> the emphasis treatment used
 * across every doc, so authors can bold with plain markup.
 */
export function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary-ink">
          <AppIcon icon={icon} className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {/* Prose caps to a legible measure so paragraphs stay readable in the
          wide DocShell (ADR-0012); wide children — grids, Bento, Path — are
          left to span the full width. */}
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&>p]:max-w-3xl [&_b]:font-semibold [&_b]:text-foreground">
        {children}
      </div>
    </section>
  );
}
