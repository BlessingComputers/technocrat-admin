"use client";

import { useId, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
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
import { ChoiceCardGroup } from "@/components/shared/choice-card";
import {
  ItemScopePicker,
  type ScopeItem,
} from "@/components/shared/item-scope-picker";
import {
  AllScopeNote,
  DetailsGroup,
  FixedScope,
  FooterButtons,
  FooterNote,
  FormGroup,
  ImpactSection,
  MarkupDialogBody,
  MarkupDialogContent,
  MarkupDialogFooter,
  MarkupDialogHead,
  MarkupPercentField,
  MiniImpact,
  PriorityLadder,
  ReplaceConfirm,
  ReplaceOption,
  ReplaceResult,
  Tok,
  type ImpactStatus,
  type ReplacedRow,
} from "@/components/shared/markup-rule-dialog";
import { ApiError } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  foldLadder,
  sortImpactRows,
  summarizeImpact,
  type ImpactRow,
} from "@/lib/utils/markup-impact";
import {
  usePartMarkupImpact,
  usePartMarkupPartSearch,
  usePartRuleAtTarget,
} from "../../api/pricing.queries";
import {
  PART_TIER_LABEL,
  PART_TIERS,
  partLadder,
  replacedRuleRows,
  ruleScopeLabel,
  rulesToReplace,
  tierOf,
  type PartTier,
} from "./markup-rule-utils";
import { formatExpiry, markupRuleExpiry } from "./sale-timing";
import type { Brand, Category, PartType } from "../../types/parts";
import {
  PART_MARKUP_MAX_PERCENT,
  PART_MARKUP_MIN_PERCENT,
  partRuleTypeOf,
  type PartMarkupApplyTo,
  type PartMarkupPreviewInput,
  type PartMarkupRule,
  type PartMarkupRuleTarget,
  type ReplacedPartMarkups,
} from "../../types/pricing";
import {
  EMPTY_MARKUP_RULE,
  partMarkupRuleFormSchema,
  type PartMarkupRuleFormValues,
} from "../../schemas/markup-rule-form";

const ANY = "__any__";

/** Wait this long after the last change before asking for a new preview. */
const PREVIEW_DEBOUNCE_MS = 600;

type ScopeMode = "all" | "taxonomy" | "item";

const SCOPE_OPTIONS = [
  { value: "all", title: "All parts", detail: "The fallback when no other rule fits" },
  { value: "taxonomy", title: "Category, brand or type", detail: "A slice of the parts" },
  { value: "item", title: "One part", detail: "Beats every other rule" },
] as const;

const APPLY_TO_OPTIONS: { value: PartMarkupApplyTo; label: string }[] = [
  { value: "PRICE", label: "Price" },
  { value: "COMPARE_AT_PRICE", label: "Compare-at price" },
  { value: "BOTH", label: "Both" },
];

const NOUN = { one: "part", many: "parts" };
const KEEPS_RUNNING = "Deals and flash sales keep running.";

interface MarkupRuleFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PartMarkupRule | null;
  categories: Category[];
  brands: Brand[];
  partTypes: PartType[];
  /**
   * The Markup screen's part rule list (markups only, active or not). Feeds
   * the ladder counts, the replace count, and the "Turned off" list.
   */
  rules: PartMarkupRule[];
  /**
   * Saves the rule. Resolves with the saved rule; the dialog closes itself,
   * or shows the replace result. Rejects to keep the dialog open.
   */
  onSubmit: (values: PartMarkupRuleFormValues) => Promise<PartMarkupRule>;
  isSubmitting: boolean;
}

export function MarkupRuleFormDialog({
  isOpen,
  onOpenChange,
  initial,
  categories,
  brands,
  partTypes,
  rules,
  onSubmit,
  isSubmitting,
}: MarkupRuleFormDialogProps) {
  const isEditing = !!initial;
  const ids = useId();

  // A rule targets every part, a category/brand/type slice, or one exact part
  // (backend either/or refine). Scope is immutable once a rule exists. The
  // caller remounts this dialog on every open, so seeding state here is enough.
  const [scopeMode, setScopeMode] = useState<ScopeMode>(() =>
    !initial
      ? "taxonomy"
      : initial.partId
        ? "item"
        : tierOf(initial) === "all"
          ? "all"
          : "taxonomy",
  );
  const [part, setPart] = useState<ScopeItem | null>(
    initial?.partId ? { id: initial.partId, name: initial.part?.name ?? "Selected part" } : null,
  );
  const [partTerm, setPartTerm] = useState("");
  const { data: partResults = [], isFetching: isSearchingParts } =
    usePartMarkupPartSearch(scopeMode === "item" ? partTerm : "");

  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [brandId, setBrandId] = useState(initial?.brandId ?? "");
  const [partTypeId, setPartTypeId] = useState(initial?.partTypeId ?? "");
  // Always a positive magnitude on this screen. A negative percentage is a
  // deal, and deals are created from /pricing/deals.
  const [percentage, setPercentage] = useState(
    String(initial?.markupPercentage ?? EMPTY_MARKUP_RULE.markupPercentage),
  );
  const [applyTo, setApplyTo] = useState<PartMarkupApplyTo>(
    initial?.applyTo ?? EMPTY_MARKUP_RULE.applyTo,
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [replace, setReplace] = useState(false);
  const [ladderExpanded, setLadderExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // form → confirm (replace only) → done (replace only).
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [result, setResult] = useState<{
    replaced: ReplacedPartMarkups;
    rows: ReplacedRow[];
  } | null>(null);

  // ── The chosen scope ────────────────────────────────────────────────
  const isAll = scopeMode === "all";
  const isItemScope = scopeMode === "item";
  const isTaxonomy = scopeMode === "taxonomy";
  const category = (isTaxonomy && categoryId) || undefined;
  const brand = (isTaxonomy && brandId) || undefined;
  const partType = (isTaxonomy && partTypeId) || undefined;
  const scopePartId = isItemScope ? part?.id : undefined;
  const pct = Number(percentage) || 0;
  const pctValid = pct >= PART_MARKUP_MIN_PERCENT && pct <= PART_MARKUP_MAX_PERCENT;

  // "Any" on all three would be the all-parts rule by another name, so the
  // slice waits for a pick; the All card is the way to that rule.
  const scopeReady = isAll || !!scopePartId || !!(category || brand || partType);
  const selfTier: PartTier | null = isAll
    ? "all"
    : isItemScope
      ? "part"
      : scopeReady
        ? tierOf({ categoryId: category, brandId: brand, partTypeId: partType })
        : null;

  // ── Clash check (create only) ───────────────────────────────────────
  // Deals are the same backend rows at the same targets, and this screen does
  // not list them, so without this a markup saved over a running sale ends it
  // with nothing on screen to say so. `{}` finds an existing all-parts rule.
  const target: PartMarkupRuleTarget | null =
    isEditing || !scopeReady
      ? null
      : { partId: scopePartId, categoryId: category, brandId: brand, partTypeId: partType };
  const { rule: ruleAtTarget, isChecking: isCheckingTarget } = usePartRuleAtTarget(target);
  const clashType = ruleAtTarget ? partRuleTypeOf(ruleAtTarget) : null;
  const blockedByMarkup = clashType === "MARKUP";

  // ── Replace (ask 41) ────────────────────────────────────────────────
  const canReplace = isAll && (!initial || initial.isActive);
  const toReplace = useMemo(() => rulesToReplace(rules, initial?.id), [rules, initial?.id]);
  const replaceOn = canReplace && replace && isActive && toReplace.length > 0;

  // ── Live impact ─────────────────────────────────────────────────────
  const previewInput: PartMarkupPreviewInput | null =
    scopeReady && pctValid
      ? {
          categoryId: category,
          brandId: brand,
          partTypeId: partType,
          scopePartId,
          markupPercentage: pct,
          applyTo,
        }
      : null;
  const previewKey = JSON.stringify(previewInput);
  const debouncedKey = useDebouncedValue(previewKey, PREVIEW_DEBOUNCE_MS);
  const debouncedInput = useMemo(
    () => JSON.parse(debouncedKey) as PartMarkupPreviewInput | null,
    [debouncedKey],
  );
  const impact = usePartMarkupImpact(debouncedInput);
  const impactError = impact.error as ApiError | null;
  const impactStatus: ImpactStatus = !previewInput
    ? "idle"
    : impactError
      ? impactError.status === 404
        ? "missing"
        : "error"
      : impact.data
        ? "ready"
        : "loading";
  const { rows: impactRows, summary } = useMemo(() => {
    if (!impact.data) return { rows: [], summary: null };
    const rows: ImpactRow[] = impact.data.parts.map((p) => ({
      id: p.partId,
      name: p.name,
      detail: p.partNumber ?? undefined,
      current: p.currentPrice,
      projected: p.projectedPrice,
      covered: !!p.coveredByOtherRule,
    }));
    return {
      rows: sortImpactRows(rows, replaceOn),
      summary: summarizeImpact(rows, replaceOn),
    };
  }, [impact.data, replaceOn]);
  const shownSummary = impactStatus === "ready" ? summary : null;

  // ── Ladder (9 tiers, folded) ────────────────────────────────────────
  const ladder = selfTier ? partLadder(rules, selfTier, initial?.id, replaceOn) : [];
  const folded = foldLadder(ladder, ladderExpanded);
  const nameOf = (list: { id: string; name: string }[], id?: string) =>
    id ? list.find((x) => x.id === id)?.name : undefined;
  const categoryName = nameOf(categories, category) ?? initial?.category?.name;
  const brandName = nameOf(brands, brand) ?? initial?.brand?.name;
  const typeName = nameOf(partTypes, partType) ?? initial?.partType?.name;
  const selfDetail = isAll
    ? replaceOn
      ? "The only markup left"
      : "Store-wide fallback"
    : isItemScope
      ? (part?.name ?? "Pick a part")
      : [categoryName, brandName, typeName].filter(Boolean).join(" · ");

  // ── Title: the rule as a sentence ───────────────────────────────────
  const pctTok = pct > 0 ? <Tok pct>+{pct}%</Tok> : <Tok empty>a %</Tok>;
  const title = isAll ? (
    <>
      Mark up <Tok>all parts</Tok> by {pctTok}
      {replaceOn && step !== "done" ? ", and turn off the other markups" : ""}
    </>
  ) : isItemScope ? (
    <>
      Mark up <Tok empty={!part}>{part?.name ?? "one part"}</Tok> by {pctTok}
    </>
  ) : category || brand || partType ? (
    <>
      Mark up <Tok>{categoryName ?? "any category"}</Tok>,{" "}
      <Tok>{brandName ?? "any brand"}</Tok>, <Tok>{typeName ?? "any type"}</Tok>, by {pctTok}
    </>
  ) : (
    <>
      Mark up <Tok empty>a category</Tok>, <Tok empty>a brand</Tok> or{" "}
      <Tok empty>a type</Tok> by {pctTok}
    </>
  );
  const description =
    step === "done"
      ? "Saved. It is now the only standing markup for parts."
      : initial
        ? `Editing ${initial.ruleId ?? "this rule"}. Nothing changes until you update it.`
        : "New markup rule. Nothing changes until you create it.";

  // ── Save ────────────────────────────────────────────────────────────
  const buildValues = (): PartMarkupRuleFormValues | null => {
    if (!isEditing && !scopeReady) {
      setError(
        isItemScope
          ? "Pick a part."
          : "Pick a category, a brand or a part type, or choose All parts.",
      );
      return null;
    }
    const parsed = partMarkupRuleFormSchema.safeParse({
      categoryId: category,
      brandId: brand,
      partTypeId: partType,
      partId: scopePartId,
      markupPercentage: Number(percentage),
      applyTo,
      notes: notes.trim() || undefined,
      isActive,
      replaceExisting: replaceOn || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input.");
      return null;
    }
    setError(null);
    return parsed.data;
  };

  const save = (values: PartMarkupRuleFormValues) => {
    // The list refetches straight after a replace, with these rules inactive,
    // so match the result against the list as it is now.
    const before = toReplace;
    onSubmit(values)
      .then((saved) => {
        if (values.replaceExisting && saved.replaced) {
          setResult({
            replaced: saved.replaced,
            rows: replacedRuleRows(saved.replaced.rulesReplaced, before),
          });
          setStep("done");
        } else {
          onOpenChange(false);
        }
      })
      .catch(() => setStep("form"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const values = buildValues();
    if (!values) return;
    if (values.replaceExisting) {
      setStep("confirm");
      return;
    }
    save(values);
  };

  const confirmReplace = () => {
    const values = buildValues();
    if (values) save(values);
  };

  const close = () => onOpenChange(false);
  const impactId = `${ids}-impact`;
  const changing = shownSummary ? shownSummary.up + shownSummary.down : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <MarkupDialogContent>
        <MarkupDialogHead title={title} description={description} onClose={close} />

        {step === "done" && result ? (
          <>
            <ReplaceResult
              facts={[
                { value: result.replaced.partsRepriced, label: "parts repriced" },
                { value: result.replaced.partsReset, label: "set to base price" },
                { value: result.replaced.rulesReplaced.length, label: "markups turned off" },
              ]}
              rows={result.rows}
            />
            <MarkupDialogFooter>
              <FooterNote>Deals and flash sales kept running.</FooterNote>
              <FooterButtons>
                <Button type="button" onClick={close} className="h-10 rounded-lg px-5 font-semibold">
                  Done
                </Button>
              </FooterButtons>
            </MarkupDialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <MarkupDialogBody
              form={
                <>
                  <FormGroup title="Scope">
                    {initial ? (
                      <FixedScope
                        tier={PART_TIER_LABEL[tierOf(initial)]}
                        scope={ruleScopeLabel(initial)}
                      />
                    ) : (
                      <>
                        <ChoiceCardGroup
                          label="Scope"
                          value={scopeMode}
                          onChange={(v) => {
                            setScopeMode(v);
                            setError(null);
                          }}
                          options={SCOPE_OPTIONS}
                          className="grid gap-2 sm:grid-cols-3 max-sm:gap-1.5"
                          cardClassName="rounded-[11px] max-sm:py-2.5"
                        />
                        {isAll && <AllScopeNote noun="part" label="All parts" />}
                        {isItemScope && (
                          <ItemScopePicker
                            label="Part"
                            noun="parts"
                            selected={part}
                            onSelect={setPart}
                            onClear={() => setPart(null)}
                            onTermChange={setPartTerm}
                            results={partResults}
                            isFetching={isSearchingParts}
                            hint="This percentage applies to the exact part, overriding any category, brand, or part-type rule."
                          />
                        )}
                        {isTaxonomy && (
                          <div className="grid gap-3 sm:grid-cols-3 max-sm:gap-2.5">
                            <ScopeSelect label="Category" value={categoryId} onChange={setCategoryId} options={categories} />
                            <ScopeSelect label="Brand" value={brandId} onChange={setBrandId} options={brands} />
                            <ScopeSelect label="Part type" value={partTypeId} onChange={setPartTypeId} options={partTypes} />
                          </div>
                        )}
                      </>
                    )}
                  </FormGroup>

                  <FormGroup title="Markup" htmlFor={`${ids}-pct`}>
                    <MarkupPercentField
                      id={`${ids}-pct`}
                      value={percentage}
                      onChange={setPercentage}
                      min={PART_MARKUP_MIN_PERCENT}
                      max={PART_MARKUP_MAX_PERCENT}
                    />
                    <Field label="Applies to" htmlFor={`${ids}-apply`}>
                      <Select value={applyTo} onValueChange={(v) => setApplyTo(v as PartMarkupApplyTo)}>
                        <SelectTrigger id={`${ids}-apply`} className="h-10 w-full sm:w-60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {APPLY_TO_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FormGroup>

                  {canReplace && (
                    <ReplaceOption
                      id={`${ids}-replace`}
                      checked={replace && isActive}
                      onChange={setReplace}
                      count={toReplace.length}
                      disabled={!isActive}
                      keepsRunning={KEEPS_RUNNING}
                    />
                  )}

                  <DetailsGroup>
                    <Field label="Notes (optional)" htmlFor={`${ids}-notes`}>
                      <Input
                        id={`${ids}-notes`}
                        placeholder="Why this rule exists"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        maxLength={500}
                        className="h-10"
                      />
                    </Field>
                    <div className="flex items-center justify-between gap-4 rounded-[11px] border border-border px-3.5 py-3">
                      <label htmlFor={`${ids}-active`}>
                        <span className="block text-sm font-semibold text-foreground">Active</span>
                        <span className="block text-xs text-muted-foreground">
                          New and edited parts get this price at once.
                        </span>
                      </label>
                      <Switch
                        id={`${ids}-active`}
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                    </div>
                  </DetailsGroup>

                  {error && (
                    <p role="alert" className="text-xs font-medium text-destructive-ink">
                      {error}
                    </p>
                  )}
                </>
              }
              side={
                <>
                  {/* What already sits on this exact scope. A deal is the same
                      backend row at the same target, so saving over one ends
                      it, and this screen never lists it. */}
                  {ruleAtTarget && clashType && (
                    <div className="px-5 pt-4.5 max-sm:px-4 max-sm:pt-4">
                      <ClashNotice
                        rule={ruleAtTarget}
                        type={clashType}
                        percentage={pct}
                        isAll={isAll}
                      />
                    </div>
                  )}
                  {selfTier ? (
                    <PriorityLadder
                      id={`${ids}-ladder`}
                      rows={folded.visible}
                      selfDetail={selfDetail}
                      replace={replaceOn}
                      hidden={folded.hidden}
                      expanded={ladderExpanded}
                      onToggle={() => setLadderExpanded((v) => !v)}
                      totalTiers={PART_TIERS.length}
                    />
                  ) : (
                    <section>
                      <h3 className="text-sm font-semibold text-foreground">Where it sits</h3>
                      <p className="mt-2.5 text-sm text-muted-foreground">
                        Pick a category, a brand or a part type to see where this rule sits.
                      </p>
                    </section>
                  )}
                  <ImpactSection
                    id={impactId}
                    status={impactStatus}
                    updating={previewKey !== debouncedKey || impact.isFetching}
                    errorMessage={impactError?.message}
                    missingMessage="No active parts match this scope yet."
                    summary={summary}
                    rows={impactRows}
                    replace={replaceOn}
                    noun={NOUN}
                  />
                </>
              }
            />

            {step === "confirm" && replaceOn ? (
              <MarkupDialogFooter confirm>
                <ReplaceConfirm
                  title={`Turn off ${toReplace.length} markup${toReplace.length === 1 ? "" : "s"} and reprice ${
                    changing != null ? `${changing.toLocaleString("en-NG")} part${changing === 1 ? "" : "s"}` : "their parts"
                  } now?`}
                  detail={KEEPS_RUNNING}
                  holdLabel={`Hold to turn off ${toReplace.length} and save`}
                  onBack={() => setStep("form")}
                  onConfirm={confirmReplace}
                  pending={isSubmitting}
                />
              </MarkupDialogFooter>
            ) : (
              <MarkupDialogFooter>
                <FooterNote>Esc closes without saving.</FooterNote>
                <MiniImpact summary={shownSummary} targetId={impactId} />
                <FooterButtons>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={close}
                    className="h-10 rounded-lg font-medium text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isCheckingTarget || blockedByMarkup}
                    className="h-10 rounded-lg px-5 font-semibold"
                  >
                    {isSubmitting
                      ? "Saving…"
                      : isEditing
                        ? "Update rule"
                        : clashType === "DISCOUNT"
                          ? `End the deal and set +${pct}%`
                          : "Create rule"}
                  </Button>
                </FooterButtons>
              </MarkupDialogFooter>
            )}
          </form>
        )}
      </MarkupDialogContent>
    </Dialog>
  );
}

/**
 * The rule already sitting on this exact scope, and what saving will do to it.
 *
 * Two different situations, one panel:
 *
 * - A **deal** is destroyed by the save. The backend overwrites the row rather
 *   than refusing, so this warning is the only thing between staff and a sale
 *   that ends without warning.
 * - A **markup** blocks the save outright. Editing that rule is the only way to
 *   change it — the server refuses a second one at the same scope with a 409.
 *   For the "All parts" scope that means the store already has its one
 *   fallback rule.
 *
 * Inactive rules count. The backend's duplicate check ignores `isActive`, so a
 * switched-off rule still occupies the scope.
 */
function ClashNotice({
  rule,
  type,
  percentage,
  isAll,
}: {
  rule: PartMarkupRule;
  type: "MARKUP" | "DISCOUNT";
  percentage: number;
  isAll: boolean;
}) {
  const isDeal = type === "DISCOUNT";
  const expiry = markupRuleExpiry(rule.expiresAt);
  const name = rule.notes?.trim();
  const ref = rule.ruleId ? ` (${rule.ruleId})` : "";

  return (
    <div
      role="alert"
      className={
        isDeal
          ? "space-y-1 rounded-lg border border-warning/50 bg-warning/10 p-3"
          : "space-y-1 rounded-lg border border-destructive/50 bg-destructive/10 p-3"
      }
    >
      <p
        className={
          isDeal
            ? "text-sm font-semibold text-warning-ink"
            : "text-sm font-semibold text-destructive-ink"
        }
      >
        {isDeal
          ? `A deal is on this scope: ${name || ruleScopeLabel(rule)}, −${Math.abs(rule.markupPercentage)}%`
          : isAll
            ? `An “All parts” rule already exists: +${rule.markupPercentage}%`
            : `A markup rule already covers this scope: +${rule.markupPercentage}%`}
      </p>
      <p className="text-xs font-medium text-muted-foreground">
        {isDeal
          ? `Saving this markup ends that deal now and prices will jump. ${
              expiry.state === "scheduled"
                ? `It was set to run until ${formatExpiry(expiry.at)}.`
                : expiry.state === "expired"
                  ? `Its end time (${formatExpiry(expiry.at)}) has passed, but prices only revert on the next five-minute sweep.`
                  : "It runs until someone cancels it."
            }${rule.isActive ? "" : " It is switched off, and still occupies the scope."}`
          : isAll
            ? `Only one can exist, active or not${ref}. Edit that rule to change it.`
            : `Only one rule can sit on a scope, active or not${ref}. Edit that rule to change it, or pick a more specific scope.`}
      </p>
      {isDeal && percentage > 0 && (
        <p className="text-xs font-medium text-muted-foreground">
          Prices here move from −{Math.abs(rule.markupPercentage)}% to +
          {percentage}% the moment you save.
        </p>
      )}
    </div>
  );
}

function ScopeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
}) {
  return (
    <Field label={label}>
      <Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? "" : v)}>
        <SelectTrigger className="h-10 w-full" aria-label={label}>
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
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
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="ml-0.5 text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
