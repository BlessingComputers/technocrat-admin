"use client";

/**
 * TEMPORARY design-review page (ADR-0009) — sidebar tint comparison.
 * Renders the nav rail three times, each overriding only `--tint-hue`
 * (maroon / secondary-blue / accent-gold) so we can lock the sidebar look.
 * Delete this route before cutover. View at /design-preview.
 */

import { Icon } from "@iconify/react";
import type { CSSProperties } from "react";

type Item = {
  title: string;
  icon: string; // Solar linear (inactive)
  iconActive: string; // Solar bold (active)
  active?: boolean;
};

type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "MAIN",
    items: [
      {
        title: "Dashboard",
        icon: "solar:widget-5-linear",
        iconActive: "solar:widget-5-bold",
        active: true,
      },
      {
        title: "Orders",
        icon: "solar:cart-large-2-linear",
        iconActive: "solar:cart-large-2-bold",
      },
    ],
  },
  {
    label: "RESOURCES",
    items: [
      {
        title: "Products",
        icon: "solar:box-linear",
        iconActive: "solar:box-bold",
      },
      {
        title: "Customers",
        icon: "solar:users-group-rounded-linear",
        iconActive: "solar:users-group-rounded-bold",
      },
      {
        title: "Invoices",
        icon: "solar:bill-list-linear",
        iconActive: "solar:bill-list-bold",
      },
    ],
  },
];

const TINTS: { label: string; hue: string; note?: string }[] = [
  { label: "Maroon (primary)", hue: "18.8", note: "recommended" },
  { label: "Blue (secondary)", hue: "256.85" },
  { label: "Gold (accent)", hue: "84.27" },
];

function Rail({ hue, label, note }: { hue: string; label: string; note?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-sm font-semibold text-neutral-800">{label}</span>
        {note && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
            {note}
          </span>
        )}
      </div>

      <div
        style={
          {
            // Override the real sidebar tokens directly so each column shows a
            // distinct, visible tint (the :root `var(--tint-hue)` indirection
            // can't be re-resolved by an inherited override — see notes).
            "--sidebar": `oklch(0.985 0.013 ${hue})`,
            "--sidebar-border": `oklch(0.91 0.022 ${hue})`,
          } as CSSProperties
        }
        className="w-64 rounded-2xl border border-sidebar-border bg-sidebar p-3 shadow-sm"
      >
        <div className="px-3 py-4 text-lg font-extrabold tracking-tight text-sidebar-foreground">
          Technocrat<span className="text-primary">.</span>
        </div>

        {GROUPS.map((group) => (
          <div key={group.label} className="py-2">
            <div className="mb-1 px-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
              {group.label}
            </div>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <div
                  key={item.title}
                  className={
                    item.active
                      ? "flex h-9 items-center justify-between gap-3 rounded-lg bg-sidebar-accent px-3 font-semibold text-sidebar-accent-foreground"
                      : "flex h-9 items-center gap-3 rounded-lg px-3 text-muted-foreground hover:bg-sidebar-accent/50"
                  }
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      icon={item.active ? item.iconActive : item.icon}
                      className={item.active ? "size-5 text-primary" : "size-5"}
                    />
                    <span className="text-sm">{item.title}</span>
                  </span>
                  {item.active && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DesignPreviewPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-10">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Sidebar tint</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Same rail, three values of <code>--tint-hue</code>. Active item + dot stay
        maroon (primary) in all three. Pick one.
      </p>
      <div className="flex flex-wrap gap-10">
        {TINTS.map((t) => (
          <Rail key={t.hue} hue={t.hue} label={t.label} note={t.note} />
        ))}
      </div>
    </main>
  );
}
