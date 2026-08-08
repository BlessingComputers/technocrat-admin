"use client";

import { periodToDateRange } from "../utils/period-to-range";

interface DateRange {
  startDate: string;
  endDate: string;
}

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "this_month", label: "This Month" },
];

/** Preset pills + custom From/To inputs. Shared by the management list and the
 * uploader detail page. */
export function UploaderDateRange({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (range: DateRange) => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Period
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange(periodToDateRange(preset.id, null))}
              className="rounded-lg bg-muted/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <DateField
          label="From"
          value={range.startDate}
          onChange={(v) => onChange({ ...range, startDate: v })}
        />
        <DateField
          label="To"
          value={range.endDate}
          onChange={(v) => onChange({ ...range, endDate: v })}
        />
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border/60 bg-muted/40 px-3 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
