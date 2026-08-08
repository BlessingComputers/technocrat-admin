import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * A small accent-line + tracked label used above a hub/landing heading. Kept
 * sparing by design (ADR-0011 guardrails: not above every section) — reach for
 * it on hubs and landing guides, not inside a doc's body.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary",
        className,
      )}
    >
      <span aria-hidden className="h-px w-6 bg-primary/60" />
      {children}
    </span>
  );
}
