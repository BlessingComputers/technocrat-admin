"use client";

import { cn } from "@/lib/utils/cn";
import type { InvoiceType } from "../types/invoice";

export type InvoiceTabValue = "ALL" | InvoiceType | "MANUAL";

const TABS: { value: InvoiceTabValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "INHOUSE", label: "In House" },
  { value: "OUTSOURCED", label: "Outsourced" },
  { value: "MANUAL", label: "Manual" },
];

interface InvoiceTabsProps {
  value: InvoiceTabValue;
  onChange: (value: InvoiceTabValue) => void;
}

/** Segmented control for the list type filter (All / In House / Outsourced). */
export function InvoiceTabs({ value, onChange }: InvoiceTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1">
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
