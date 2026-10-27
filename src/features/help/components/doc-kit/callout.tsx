import type { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

const CALLOUT_STYLE = {
  tip: {
    wrap: "border-primary/25 bg-primary/5",
    icon: "solar:lightbulb-bolt-linear",
    tint: "text-primary-ink",
  },
  note: {
    wrap: "border-border bg-muted/30",
    icon: "solar:info-circle-linear",
    tint: "text-muted-foreground",
  },
  warn: {
    wrap: "border-warning/30 bg-warning/10",
    icon: "solar:danger-triangle-linear",
    tint: "text-warning-ink",
  },
} as const;

/**
 * A tinted aside for a tip, note, or warning. `warn` is icon + label tinted (not
 * colour alone) so it reads without relying on hue (WCAG — PRODUCT.md).
 */
export function Callout({
  tone,
  title,
  children,
}: {
  tone: keyof typeof CALLOUT_STYLE;
  title: string;
  children: ReactNode;
}) {
  const s = CALLOUT_STYLE[tone];
  return (
    <div className={cn("flex max-w-3xl gap-3 rounded-xl border p-4", s.wrap)}>
      <AppIcon icon={s.icon} className={cn("mt-0.5 size-5 shrink-0", s.tint)} />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
          {children}
        </p>
      </div>
    </div>
  );
}
