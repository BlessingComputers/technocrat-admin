"use client";

import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/shared/app-icon";

/** Minimal shape the picker renders — a DB id plus a display name. */
export interface ScopeItem {
  id: string;
  name: string;
}

interface ItemScopePickerProps {
  /** Field label, e.g. "Product" or "Part". */
  label: string;
  /** Plural noun used in placeholder/empty copy, e.g. "products". */
  noun: string;
  /** Currently chosen item, or null while searching. */
  selected: ScopeItem | null;
  onSelect: (item: ScopeItem) => void;
  onClear: () => void;
  /**
   * Debounced search term, raised to the caller so it owns the query hook —
   * this component stays data-agnostic and therefore usable from any feature.
   */
  onTermChange: (term: string) => void;
  /** Results for the last term the caller was handed. */
  results: ScopeItem[];
  isFetching: boolean;
  /** Explanatory line under the field. */
  hint: string;
  autoFocus?: boolean;
}

/**
 * Type-ahead picker for an "exact item" rule scope (one product / one part).
 *
 * Presentational only: it debounces keystrokes and raises the term, but never
 * fetches. The owning feature supplies `results` from its own query hook, which
 * is what lets products, parts, and any future feature share this component
 * without a cross-feature import (ARCHITECTURE: shared UI may not reach into
 * `features/`).
 *
 * Once an item is chosen it collapses to a clearable chip — one item per rule.
 */
export function ItemScopePicker({
  label,
  noun,
  selected,
  onSelect,
  onClear,
  onTermChange,
  results,
  isFetching,
  hint,
  autoFocus,
}: ItemScopePickerProps) {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (value: string) => {
    setInput(value);
    if (timer.current) clearTimeout(timer.current);
    // Debounced in an event handler (not an effect) so the search fires after
    // the user pauses, without tripping the set-state-in-effect ban.
    timer.current = setTimeout(() => {
      setTerm(value);
      onTermChange(value);
    }, 250);
  };

  const showResults = !selected && term.trim().length >= 2;

  if (selected) {
    return (
      <Field label={label}>
        <div className="flex h-9 items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3">
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <AppIcon
              icon="solar:box-linear"
              className="size-4 shrink-0 text-primary-ink"
            />
            <span className="truncate">{selected.name}</span>
          </span>
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear selected ${label.toLowerCase()}`}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <AppIcon icon="solar:close-circle-linear" className="size-4" />
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field label={label}>
      {/* Results float over the fields below (absolute) instead of pushing them
          down, so typing never resizes the dialog. */}
      <div className="relative">
        <Input
          placeholder={`Search ${noun} by name…`}
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          autoFocus={autoFocus}
        />
        {showResults && (
          <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
            {isFetching && results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Searching…
              </p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No {noun} match “{term}”.
              </p>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelect(r)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted/60"
                >
                  <AppIcon
                    icon="solar:box-linear"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 truncate">{r.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Field>
  );
}

/** Segmented switch between a taxonomy scope and an exact-item override. */
export function ScopeModeToggle({
  taxonomyLabel,
  itemLabel,
  mode,
  onChange,
}: {
  taxonomyLabel: string;
  itemLabel: string;
  mode: "taxonomy" | "item";
  onChange: (mode: "taxonomy" | "item") => void;
}) {
  const options = [
    { value: "taxonomy" as const, label: taxonomyLabel },
    { value: "item" as const, label: itemLabel },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={mode === o.value}
          className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors data-[on=true]:bg-card data-[on=true]:text-foreground data-[on=true]:shadow-sm data-[on=false]:text-muted-foreground data-[on=false]:hover:text-foreground"
          data-on={mode === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground ml-1">
        {label}
      </Label>
      {children}
    </div>
  );
}
