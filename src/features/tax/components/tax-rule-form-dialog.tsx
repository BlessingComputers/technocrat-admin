"use client";

import { useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

import { useTaxPartSearch, useTaxProductSearch } from "../api/tax.queries";
import {
  partTaxRuleFormSchema,
  taxRuleFormSchema,
} from "../schemas/tax-rule-form";
import { TAX_RATE_MAX } from "../types/tax";
import type {
  AnyTaxRule,
  PartTaxRule,
  TaxonomyOption,
  TaxRule,
} from "../types/tax";
import { rateToNumber, scopeLabel } from "../utils/tax-format";
import { MetaLabel } from "@/components/shared/meta-label";

/** Sentinel for the "any / all" option (shadcn Select rejects an empty value). */
const ANY = "__any__";

/** Normalised values the dialog emits — scope keys unused by a kind stay undefined. */
export interface TaxRuleFormSubmit {
  productId?: string;
  partId?: string;
  categoryId?: string;
  brandId?: string;
  partTypeId?: string;
  rate: number;
  notes?: string;
  isActive: boolean;
}

interface TaxRuleFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "product" | "part";
  /** Rule being edited, or null when creating. */
  initial: AnyTaxRule | null;
  categories: TaxonomyOption[];
  brands: TaxonomyOption[];
  /** Only used when kind === "part". */
  partTypes: TaxonomyOption[];
  onSubmit: (values: TaxRuleFormSubmit) => void;
  isSubmitting: boolean;
}

export function TaxRuleFormDialog({
  isOpen,
  onOpenChange,
  kind,
  initial,
  categories,
  brands,
  partTypes,
  onSubmit,
  isSubmitting,
}: TaxRuleFormDialogProps) {
  const isEditing = !!initial;
  const isPart = kind === "part";

  // Both kinds can be scoped either by taxonomy (category/brand[/part type]) or
  // to one exact item (a specific product / part) — the two are mutually
  // exclusive (backend refine). Seed the mode from an existing item-scoped rule
  // so edit reflects reality (scope is read-only in edit, but the mode still
  // drives which fields render).
  const initialItem = isPart
    ? (initial as PartTaxRule | null)?.part
      ? {
          id: (initial as PartTaxRule).partId as string,
          name: (initial as PartTaxRule).part!.name,
        }
      : null
    : (initial as TaxRule | null)?.product
      ? {
          id: (initial as TaxRule).productId as string,
          name: (initial as TaxRule).product!.name,
        }
      : null;
  const [scopeMode, setScopeMode] = useState<"taxonomy" | "item">(
    initialItem ? "item" : "taxonomy",
  );
  const [item, setItem] = useState<{ id: string; name: string } | null>(
    initialItem,
  );

  // Seeded from `initial` on mount. The parent remounts this dialog (via a
  // `key` that changes each time it's opened), so create resets and edit
  // prefills cleanly without a setState-in-effect sync.
  const [categoryId, setCategoryId] = useState<string>(
    initial?.categoryId ?? ANY,
  );
  const [brandId, setBrandId] = useState<string>(initial?.brandId ?? ANY);
  const [partTypeId, setPartTypeId] = useState<string>(
    (initial as PartTaxRule | null)?.partTypeId ?? ANY,
  );
  const [rate, setRate] = useState<string>(
    initial ? String(rateToNumber(initial.rate)) : "",
  );
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Exact-item scope stands alone — taxonomy fields are omitted so the
    // backend's id-XOR-taxonomy refine is satisfied. The id lands on `partId`
    // for parts, `productId` for products.
    const rateBase = {
      rate: Number(rate),
      notes: notes.trim() || undefined,
      isActive,
    };
    let raw: Record<string, unknown>;
    if (scopeMode === "item") {
      raw = isPart
        ? { ...rateBase, partId: item?.id }
        : { ...rateBase, productId: item?.id };
    } else {
      const taxonomy = {
        ...rateBase,
        categoryId: categoryId === ANY ? undefined : categoryId,
        brandId: brandId === ANY ? undefined : brandId,
      };
      raw = isPart
        ? { ...taxonomy, partTypeId: partTypeId === ANY ? undefined : partTypeId }
        : taxonomy;
    }

    const parsed = isPart
      ? partTaxRuleFormSchema.safeParse(raw)
      : taxRuleFormSchema.safeParse(raw);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }
    setError(null);
    onSubmit(parsed.data as TaxRuleFormSubmit);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-0 border-none">
        <div className="bg-primary rounded-t-lg p-6 text-primary-foreground">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEditing ? "Edit Tax Rule" : "New Tax Rule"}
          </DialogTitle>
          <MetaLabel tone="pinned" className="block mt-1">
            {isPart ? "Part tax override" : "Product tax override"}
          </MetaLabel>
        </div>

        {/* min-w-0: DialogContent is a CSS grid, so this form is a grid item
            with default min-width:auto. Without min-w-0, a long non-wrapping
            value (e.g. a selected product's full name) sets the item's
            min-content and blows the whole dialog past max-w-md — the leaf
            `truncate` can't take effect until this ancestor is allowed to
            shrink. */}
        <form onSubmit={handleSubmit} className="min-w-0 p-6 space-y-5">
          {isEditing ? (
            // Scope is immutable once a rule exists — show it, don't offer edits.
            <Field label="Scope">
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 h-9 text-sm font-semibold text-foreground">
                {scopeLabel(initial, kind)}
              </div>
            </Field>
          ) : (
            <>
              {/* Either kind can target one exact item (SKU / part) or a
                  category/brand[/type] slice — mutually exclusive, so offer a
                  mode switch. */}
              <ScopeModeToggle
                kind={kind}
                mode={scopeMode}
                onChange={setScopeMode}
              />

              {/* Reserve a stable height so switching modes doesn't jump the
                  fields below — both branches fit within this min-height. */}
              <div className="min-h-[6.5rem] space-y-4">
                {scopeMode === "item" ? (
                  <ItemScopePicker
                    kind={kind}
                    selected={item}
                    onSelect={setItem}
                    onClear={() => setItem(null)}
                  />
                ) : (
                  <>
                    <div
                      className={cn(
                        "grid gap-4",
                        isPart
                          ? "grid-cols-1 sm:grid-cols-3"
                          : "grid-cols-1 sm:grid-cols-2",
                      )}
                    >
                      <ScopeSelect
                        label="Category"
                        placeholder="Any category"
                        value={categoryId}
                        onChange={setCategoryId}
                        options={categories}
                      />
                      <ScopeSelect
                        label="Brand"
                        placeholder="Any brand"
                        value={brandId}
                        onChange={setBrandId}
                        options={brands}
                      />
                      {isPart && (
                        <ScopeSelect
                          label="Part type"
                          placeholder="Any type"
                          value={partTypeId}
                          onChange={setPartTypeId}
                          options={partTypes}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pick at least one. A rule replaces the store rate for
                      everything in its scope; the most specific matching rule
                      wins.
                    </p>
                  </>
                )}
              </div>
            </>
          )}

          <Field label={`Tax rate % (0–${TAX_RATE_MAX})`}>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={TAX_RATE_MAX}
              step="0.01"
              placeholder="e.g. 7.5"
              value={rate}
              onKeyDown={(e) => {
                if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
              }}
              onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ""))}
              required
            />
          </Field>

          <Field label="Notes (optional)">
            <Input
              placeholder="Why this rule exists"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/10">
            <div>
              <p className="text-sm font-semibold text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive rules are ignored — the store rate applies instead
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {error && (
            <p className="text-xs font-semibold text-destructive-ink" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-lg font-medium text-muted-foreground h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] rounded-lg bg-primary text-primary-foreground font-medium h-11"
            >
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Update Rule"
                  : "Create Rule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Segmented switch between taxonomy scope and an exact-item override. */
function ScopeModeToggle({
  kind,
  mode,
  onChange,
}: {
  kind: "product" | "part";
  mode: "taxonomy" | "item";
  onChange: (mode: "taxonomy" | "item") => void;
}) {
  const isPart = kind === "part";
  const options = [
    {
      value: "taxonomy" as const,
      label: isPart ? "Category / Brand / Type" : "Category / Brand",
    },
    {
      value: "item" as const,
      label: isPart ? "Specific part" : "Specific product",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={mode === o.value}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            mode === o.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Type-ahead picker for the exact-item scope. Debounces keystrokes, searches
 * the product or part catalog via the tax service, and emits the item's DB `id`
 * (what `POST /tax/rules { productId }` / `/tax/part-rules { partId }` resolves
 * against). Once an item is chosen it collapses to a clearable chip — one item
 * per rule.
 */
function ItemScopePicker({
  kind,
  selected,
  onSelect,
  onClear,
}: {
  kind: "product" | "part";
  selected: { id: string; name: string } | null;
  onSelect: (item: { id: string; name: string }) => void;
  onClear: () => void;
}) {
  const isPart = kind === "part";
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (value: string) => {
    setInput(value);
    if (timer.current) clearTimeout(timer.current);
    // Debounced in an event handler (not an effect) so the catalog search
    // fires after the user pauses, without tripping the set-state-in-effect ban.
    timer.current = setTimeout(() => setTerm(value), 250);
  };

  // Both hooks run every render (rules of hooks); the inactive kind is passed an
  // empty term so its query stays disabled — only the active catalog is hit.
  const productSearch = useTaxProductSearch(isPart ? "" : term);
  const partSearch = useTaxPartSearch(isPart ? term : "");
  const { data: results = [], isFetching } = isPart ? partSearch : productSearch;

  const label = isPart ? "Part" : "Product";
  const noun = isPart ? "parts" : "products";
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
            aria-label={`Clear selected ${kind}`}
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
          autoFocus
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
              results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect({ id: p.id, name: p.name })}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted/60"
                >
                  <AppIcon
                    icon="solar:box-linear"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 truncate">{p.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        This rate applies to the exact {kind}, overriding any category
        {isPart ? ", brand, or part-type" : " or brand"} rule.
      </p>
    </Field>
  );
}

function ScopeSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: TaxonomyOption[];
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
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
      <Label className="text-xs font-medium text-muted-foreground ml-1">
        {label}
      </Label>
      {children}
    </div>
  );
}
