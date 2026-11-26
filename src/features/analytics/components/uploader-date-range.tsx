"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import { periodToDateRange } from "../utils/period-to-range";
import {
  activePreset,
  describeRange,
  MAX_WEEKS,
  pastWeeksOf,
  pastWeeksRange,
  PRESET_LABELS,
  rangeError,
  type DateRange,
  type PeriodPreset,
} from "../model/upload-period";

const SEGMENT =
  "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const SEGMENT_ON = "bg-primary text-primary-foreground shadow-sm";
const SEGMENT_OFF = "text-muted-foreground hover:bg-muted hover:text-foreground";

/**
 * One period control for the uploads pages: Today, Last week (Mon–Sat), a
 * "Past x weeks" stepper, This month and a "Custom" popover, plus the window
 * in words. The selected period is always highlighted, and custom dates apply
 * only on "Apply".
 */
export function UploaderDateRange({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const active = activePreset(range);
  const preset = (id: PeriodPreset) => (
    <button
      type="button"
      aria-pressed={active === id}
      onClick={() => onChange(periodToDateRange(id, null))}
      className={cn(SEGMENT, active === id ? SEGMENT_ON : SEGMENT_OFF)}
    >
      {PRESET_LABELS[id]}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div
        role="group"
        aria-label="Period"
        className="inline-flex flex-wrap gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1"
      >
        {preset("today")}
        {preset("last_week")}
        <PastWeeks range={range} active={active === "weeks"} onChange={onChange} />
        {preset("this_month")}
        <CustomRange range={range} active={active === "custom"} onApply={onChange} />
      </div>
      <p className="text-sm font-medium tabular-nums text-muted-foreground">
        {describeRange(range)}
      </p>
    </div>
  );
}

/** "− Past x weeks +": the steppers apply at once; the label re-applies x. */
function PastWeeks({
  range,
  active,
  onChange,
}: {
  range: DateRange;
  active: boolean;
  onChange: (range: DateRange) => void;
}) {
  // Remember x while another period is selected, so the label keeps it.
  const [lastWeeks, setLastWeeks] = useState(2);
  const weeks = pastWeeksOf(range) ?? lastWeeks;
  const apply = (n: number) => {
    setLastWeeks(n);
    onChange(pastWeeksRange(n));
  };
  const step =
    "inline-flex size-6 items-center justify-center rounded-md text-sm font-semibold disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div
      className={cn(
        "inline-flex h-8 items-center gap-0.5 rounded-lg px-1",
        active ? SEGMENT_ON : "text-muted-foreground",
      )}
    >
      <button
        type="button"
        aria-label="One week fewer"
        disabled={weeks <= 1}
        onClick={() => apply(weeks - 1)}
        className={cn(step, active ? "hover:bg-primary-foreground/15" : "hover:bg-muted hover:text-foreground")}
      >
        −
      </button>
      <button
        type="button"
        aria-pressed={active}
        onClick={() => apply(weeks)}
        className={cn(
          "h-6 rounded-md px-1.5 text-xs font-semibold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !active && "hover:text-foreground",
        )}
      >
        Past {weeks} {weeks === 1 ? "week" : "weeks"}
      </button>
      <button
        type="button"
        aria-label="One week more"
        disabled={weeks >= MAX_WEEKS}
        onClick={() => apply(weeks + 1)}
        className={cn(step, active ? "hover:bg-primary-foreground/15" : "hover:bg-muted hover:text-foreground")}
      >
        +
      </button>
    </div>
  );
}

function CustomRange({
  range,
  active,
  onApply,
}: {
  range: DateRange;
  active: boolean;
  onApply: (range: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const error = rangeError(draft);
  const today = periodToDateRange("today", null).endDate;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Start each edit from the applied window, not a stale draft.
        if (next) setDraft(range);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-pressed={active}
          className={cn(SEGMENT, active ? SEGMENT_ON : SEGMENT_OFF)}
        >
          <AppIcon icon="solar:calendar-linear" className="size-3.5" />
          Custom
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-4">
        <p className="text-sm font-semibold">Custom period</p>
        <div className="grid grid-cols-2 gap-3">
          <DateField
            id="uploads-from"
            label="From"
            value={draft.startDate}
            max={today}
            onChange={(startDate) => setDraft((d) => ({ ...d, startDate }))}
          />
          <DateField
            id="uploads-to"
            label="To"
            value={draft.endDate}
            max={today}
            onChange={(endDate) => setDraft((d) => ({ ...d, endDate }))}
          />
        </div>
        <p
          role={error ? "alert" : undefined}
          className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}
        >
          {error ?? describeRange(draft)}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!!error}
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DateField({
  id,
  label,
  value,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  max: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <input
        id={id}
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-border/60 bg-muted/40 px-2 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
