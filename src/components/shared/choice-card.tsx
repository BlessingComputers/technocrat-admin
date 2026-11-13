"use client";

import { useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * One option of a radio chooser, built from a button because the project has
 * no radio-group primitive. `role="radio"` + `aria-checked` keeps it announced
 * as the radio it looks like. Put a set of them in a `ChoiceCardGroup` for
 * the `radiogroup` role and arrow-key moves.
 */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  detail,
  className,
  tabIndex,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
  className?: string;
  tabIndex?: number;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary/50 bg-primary/[0.06]"
          : "border-border hover:bg-muted/30",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
      >
        {selected && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {detail}
        </span>
      </span>
    </button>
  );
}

/**
 * A radio group of `ChoiceCard`s: one tab stop (the selected card), and the
 * arrow keys move the selection, as a native radio group does.
 */
export function ChoiceCardGroup<V extends string>({
  label,
  value,
  onChange,
  options,
  className,
  cardClassName,
}: {
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: readonly { value: V; title: string; detail: string }[];
  className?: string;
  cardClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const next = (i + step + options.length) % options.length;
    onChange(options[next].value);
    ref.current
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [next]?.focus();
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={className}
    >
      {options.map((o) => (
        <ChoiceCard
          key={o.value}
          selected={o.value === value}
          onSelect={() => onChange(o.value)}
          title={o.title}
          detail={o.detail}
          tabIndex={o.value === value ? 0 : -1}
          className={cardClassName}
        />
      ))}
    </div>
  );
}
