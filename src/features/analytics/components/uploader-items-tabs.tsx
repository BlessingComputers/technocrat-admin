"use client";

import { cn } from "@/lib/utils/cn";
import type { UploaderTab } from "../hooks/use-uploader-detail-filters";

interface UploaderItemsTabsProps {
  tab: UploaderTab;
  onTabChange: (tab: UploaderTab) => void;
  productCount: number;
  partCount: number;
}

/** Products / Parts switcher with counts (from the report totals). */
export function UploaderItemsTabs({
  tab,
  onTabChange,
  productCount,
  partCount,
}: UploaderItemsTabsProps) {
  const tabs: { id: UploaderTab; label: string; count: number }[] = [
    { id: "products", label: "Products", count: productCount },
    { id: "parts", label: "Parts", count: partCount },
  ];

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onTabChange(entry.id)}
          className={cn(
            "relative px-4 py-2.5 text-sm font-semibold transition-colors",
            tab === entry.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {entry.label}
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">
            {entry.count}
          </span>
          {tab === entry.id && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
