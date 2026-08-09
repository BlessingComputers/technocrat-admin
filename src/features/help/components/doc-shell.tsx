import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import {
  type HelpDoc,
  helpCategory,
  HELP_TYPE_LABEL,
  HELP_SUPPORT,
} from "@/config/help-docs";

/** Shared chrome for a single help document: back link + hero + content. */
export function DocShell({
  doc,
  children,
}: {
  doc: HelpDoc;
  children: ReactNode;
}) {
  const category = helpCategory(doc.category);
  return (
    // Wide shell so bento step mosaics (ADR-0012) breathe; reading-tier pieces
    // (prose, Steps, FieldTable) cap themselves to a legible measure within it,
    // while wide-tier pieces (Bento) span the full width.
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <Link
        href="/help"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary-ink motion-reduce:transition-none"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Help Center
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary-ink">
            <AppIcon icon={doc.icon} className="size-7" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="muted" className="text-xs">
                {category.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {HELP_TYPE_LABEL[doc.type]}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {doc.title}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {doc.description}
            </p>
            {doc.updated && (
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <AppIcon icon="solar:clock-circle-linear" aria-hidden className="size-3" />
                Updated {formatUpdated(doc.updated)}
              </p>
            )}
          </div>
        </div>
      </div>

      <article className="space-y-10">{children}</article>

      <div className="rounded-xl border border-border bg-muted/20 p-5 text-center">
        <p className="text-sm font-semibold text-foreground">{HELP_SUPPORT.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{HELP_SUPPORT.body}</p>
        {HELP_SUPPORT.href && HELP_SUPPORT.cta && (
          <Link
            href={HELP_SUPPORT.href}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-ink transition-colors hover:underline motion-reduce:transition-none"
          >
            <AppIcon icon="solar:chat-round-linear" className="size-4" />
            {HELP_SUPPORT.cta}
          </Link>
        )}
      </div>
    </div>
  );
}

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
