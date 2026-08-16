"use client";

import * as React from "react";

import { AppIcon } from "@/components/shared/app-icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

/**
 * The list-page filter row, as one primitive (ticket 11, class F).
 *
 * Eight list pages had each rolled their own — same row, same search field,
 * same status select, in three mutually inconsistent spellings. The important
 * part is not the shell; it is what the shell **stops** the call sites doing.
 *
 * ⚠️ Every copy overrode the shape of the controls it contained:
 * `h-12 rounded-md border border-border bg-card focus:ring-primary/20`. That is
 * the same defect class as a `<Card>` re-declaring its own radius — it fights
 * the primitive, and `bg-card` at rest additionally kills the documented input
 * behaviour (faint muted fill at rest, lifting to `--card` on focus). Controls
 * here take their shape from `<Input>` / `<SelectTrigger>` and nothing else, so
 * a filter field is 36px like every other field in the app, not 48px.
 */
export function FilterBar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-bar"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        className,
      )}
      {...props}
    />
  );
}

export interface FilterSearchProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** Wrapper classes — the field itself is the primitive's business. */
  wrapperClassName?: string;
  icon?: string;
}

/** Search field with its leading magnifier. Eight copies of this existed. */
export function FilterSearch({
  wrapperClassName,
  icon = "solar:magnifer-linear",
  className,
  ...props
}: FilterSearchProps) {
  return (
    <div className={cn("group relative flex-1", wrapperClassName)}>
      <AppIcon
        icon={icon}
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-ink"
      />
      <Input type="search" className={cn("pl-9", className)} {...props} />
    </div>
  );
}

/**
 * Width rhythm for a filter `<SelectTrigger>` — full width when the bar has
 * wrapped to a column, a stable minimum once it is a row. Shape (height,
 * radius, hairline, focus ring) stays with `<SelectTrigger>`.
 */
export const filterControlClass = "w-full sm:w-auto sm:min-w-[160px]";
