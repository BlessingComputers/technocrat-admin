"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { MarkupRulesView } from "@/features/products";
import { PartsPricingView } from "@/features/parts";

type MarkupKind = "products" | "parts";

function isMarkupKind(value: string | null): value is MarkupKind {
  return value === "products" || value === "parts";
}

/**
 * `/pricing/markup`. Product and part markup rules under one segmented toggle.
 *
 * Products and parts are one feature over two catalogues, not two features, so
 * they share a route and get no separate sidebar row. The choice is mirrored in
 * the URL (`?kind=parts`, default = products) so the Parts catalogue can deep-link
 * straight into it.
 *
 * Lives in the `app` layer (not `features/`) on purpose: it composes sibling
 * features, and only `app` may depend on more than one (the boundaries rule
 * forbids feature→feature imports).
 */
export function MarkupWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const kindParam = searchParams.get("kind");
  const kind: MarkupKind = isMarkupKind(kindParam) ? kindParam : "products";

  const setKind = useCallback(
    (next: MarkupKind) => {
      const params = new URLSearchParams(searchParams);
      if (next === "products") params.delete("kind");
      else params.set("kind", next);
      const query = params.toString();
      router.replace(query ? `/pricing/markup?${query}` : "/pricing/markup", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <KindToggle kind={kind} onChange={setKind} />
      {kind === "products" ? <MarkupRulesView /> : <PartsPricingView />}
    </div>
  );
}

function KindToggle({
  kind,
  onChange,
}: {
  kind: MarkupKind;
  onChange: (kind: MarkupKind) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Markup catalogue"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1"
    >
      <KindButton
        active={kind === "products"}
        onClick={() => onChange("products")}
        icon="solar:box-linear"
        label="Products"
      />
      <KindButton
        active={kind === "parts"}
        onClick={() => onChange("parts")}
        icon="solar:layers-minimalistic-linear"
        label="Parts"
      />
    </div>
  );
}

function KindButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-2 rounded-md px-3.5 text-sm font-semibold transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <AppIcon icon={icon} className="size-4" />
      {label}
    </button>
  );
}
