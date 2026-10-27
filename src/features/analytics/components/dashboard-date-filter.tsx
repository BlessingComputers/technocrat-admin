"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import type { AppliedDateRange } from "../types/analytics";
import { MetaLabel } from "@/components/shared/meta-label";

interface DashboardDateFilterProps {
  period: string;
  appliedCustomDates: AppliedDateRange | null;
  onPeriodChange: (period: string) => void;
  onApplyCustomRange: (range: AppliedDateRange) => void;
}

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "this_month", label: "This Month" },
  { id: "12m", label: "12 Months" },
  { id: "custom", label: "Custom Range" },
];

/** "2026-07-01T…" → "Jul 1" for the compact applied-range label. */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Compact analytics period control shown in the dashboard header (next to
 * Refresh). A single popover holds the period options; selecting "Custom Range"
 * reveals a start/end date form in the same panel. Owns local form state and
 * commits to the parent only on "Apply Range".
 */
export function DashboardDateFilter({
  period,
  appliedCustomDates,
  onPeriodChange,
  onApplyCustomRange,
}: DashboardDateFilterProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const current = PERIODS.find((p) => p.id === period) ?? PERIODS[2];
  const triggerLabel =
    period === "custom" && appliedCustomDates
      ? `${shortDate(appliedCustomDates.from)} — ${shortDate(appliedCustomDates.to)}`
      : current.label;

  const handleSelect = (id: string) => {
    onPeriodChange(id);
    if (id !== "custom") setOpen(false);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFrom || !customTo) return;
    onApplyCustomRange({
      from: new Date(`${customFrom}T00:00:00.000Z`).toISOString(),
      to: new Date(`${customTo}T23:59:59.999Z`).toISOString(),
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-lg text-xs font-medium"
        >
          <AppIcon icon="solar:calendar-linear" className="size-4 text-primary-ink" />
          {triggerLabel}
          <AppIcon
            icon="solar:alt-arrow-down-linear"
            className="size-3.5 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 rounded-xl p-2">
        <div className="space-y-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
                period === p.id ? "text-primary-ink" : "text-foreground",
              )}
            >
              {p.label}
              {period === p.id && (
                <AppIcon
                  icon="solar:check-circle-bold"
                  className="size-4 text-primary-ink"
                />
              )}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <form
            onSubmit={handleApply}
            className="mt-2 space-y-3 border-t border-border/50 pt-3"
          >
            <DateInput
              label="Start Date"
              value={customFrom}
              onChange={setCustomFrom}
            />
            <DateInput
              label="End Date"
              value={customTo}
              onChange={setCustomTo}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 w-full rounded-lg bg-primary text-xs font-medium hover:bg-primary/90"
            >
              Apply Range
            </Button>
            {appliedCustomDates && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-success-ink">
                <AppIcon
                  icon="solar:magic-stick-3-bold"
                  className="size-3.5 animate-pulse"
                />
                Range Active
              </div>
            )}
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-full space-y-1.5">
      <MetaLabel asChild>
        <label className="flex items-center gap-1.5">
          <AppIcon icon="solar:calendar-mark-linear" className="size-3.5" />
          {label}
        </label>
      </MetaLabel>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="h-10 w-full rounded-lg border border-border/60 bg-muted/40 px-3 text-sm font-semibold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
