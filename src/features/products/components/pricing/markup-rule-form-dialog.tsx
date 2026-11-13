"use client";

import { useId, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  sortImpactRows,
  summarizeImpact,
  type ImpactRow,
} from "@/lib/utils/markup-impact";
import {
  useMarkupImpact,
  useMarkupProductSearch,
  useRuleAtTarget,
} from "../../api/pricing.queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  markupRuleFormSchema,
  type MarkupRuleFormValues,
} from "../../schemas/markup-rule-form";
import {
  MARKUP_MAX_PERCENT,
  MARKUP_MIN_PERCENT,
  ruleTypeOf,
  type MarkupPreviewInput,
  type MarkupRule,
  type MarkupRuleTarget,
  type ReplacedProductMarkups,
} from "../../types/pricing";
import {
  PRODUCT_TIER_LABEL,
  productLadder,
  replacedRuleRows,
  ruleScopeLabel,
  rulesToReplace,
  tierOf,
  type ProductTier,
} from "./markup-rule-utils";
import { formatExpiry, markupRuleExpiry } from "./sale-timing";
import type { ProductBrand, ProductCategory } from "../../types/products";

/** Sentinel for the "applies to all" option (shadcn Select rejects ""). */
const ALL = "__all__";

/** The backend documents one target for product rules: the selling price. */
const APPLY_TO = "PRICE";

/** Wait this long after the last change before asking for a new preview. */
const PREVIEW_DEBOUNCE_MS = 600;

type ScopeMode = "all" | "taxonomy" | "item";

const SCOPE_OPTIONS = [
  { value: "all", title: "All products", detail: "The fallback when no other rule fits" },
  { value: "taxonomy", title: "Category & brand", detail: "A slice of the catalogue" },
  { value: "item", title: "One product", detail: "Beats every other rule" },
] as const;

const NOUN = { one: "variant", many: "variants" };
const KEEPS_RUNNING = "Deals, hunts and flash sales keep running.";

interface MarkupRuleFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rule being edited, or null when creating. */
  initial: MarkupRule | null;
  categories: ProductCategory[];
  brands: ProductBrand[];
  /**
   * The Markup screen's rule list (markups only, active or not). Feeds the
   * ladder counts, the replace count, and the "Turned off" list after a
   * replace.
   */
  rules: MarkupRule[];
  /**
   * Saves the rule. Resolves with the saved rule; the dialog closes itself,
   * or shows the replace result. Rejects to keep the dialog open (the caller
   * shows the error).
   */
  onSubmit: (values: MarkupRuleFormValues) => Promise<MarkupRule>;
  isSubmitting: boolean;
}

export function MarkupRuleFormDialog({
  isOpen,
  onOpenChange,
  initial,
  categories,
  brands,
  rules,
  onSubmit,
  isSubmitting,
}: MarkupRuleFormDialogProps) {
  const isEditing = !!initial;
  const ids = useId();

  // A rule targets the whole store, a category/brand slice, or one exact
  // product (backend either/or refine). Scope is immutable once a rule exists,
  // so on edit the mode only decides what the read-only scope says.
  const initialProduct: ScopeItem | null = initial?.productId
    ? { id: initial.productId, name: initial.product?.name ?? "Specific product" }
    : null;
  const [scopeMode, setScopeMode] = useState<ScopeMode>(() =>
    !initial
      ? "taxonomy"
      : initial.productId
        ? "item"
        : tierOf(initial) === "all"
          ? "all"
          : "taxonomy",
  );
  const [product, setProduct] = useState<ScopeItem | null>(initialProduct);
  const [productTerm, setProductTerm] = useState("");
  const { data: productResults = [], isFetching: isSearchingProducts } =
    useMarkupProductSearch(scopeMode === "item" ? productTerm : "");

  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? ALL);
  const [brandId, setBrandId] = useState<string>(initial?.brandId ?? ALL);
  // Always a positive magnitude on this screen. A negative percentage is a
  // deal, and deals are created from /pricing/deals.
  const [percentage, setPercentage] = useState<string>(
    initial ? String(initial.markupPercentage) : "",
  );
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [replace, setReplace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // form → confirm (replace only) → done (replace only).
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [result, setResult] = useState<{
    replaced: ReplacedProductMarkups;
    rows: ReplacedRow[];
  } | null>(null);

  // ── The chosen scope ────────────────────────────────────────────────
  const isAll = scopeMode === "all";
  const isItemScope = scopeMode === "item";
  const isTaxonomy = scopeMode === "taxonomy";
  const category = isTaxonomy && categoryId !== ALL ? categoryId : undefined;
  const brand = isTaxonomy && brandId !== ALL ? brandId : undefined;
  const scopeProductId = isItemScope ? product?.id : undefined;
  const pct = Number(percentage) || 0;
  const pctValid = pct >= MARKUP_MIN_PERCENT && pct <= MARKUP_MAX_PERCENT;

  // Complete enough to look up and preview. "Category & brand" with both on
  // "All" would be the all-products rule by another name, so it waits for a
  // pick; the All card is the way to that rule.
  const scopeReady = isAll || !!scopeProductId || !!(category || brand);
  const selfTier: ProductTier | null = isAll
    ? "all"
    : isItemScope
      ? "product"
      : scopeReady
        ? tierOf({ categoryId: category, brandId: brand })
        : null;

  // ── Clash check (create only) ───────────────────────────────────────
  // Deals are the same backend rows at the same targets, and this screen does
  // not list them, so without this a markup saved over a running sale ends it
  // with nothing on screen to say so. `{}` finds an existing all-products rule.
  const target: MarkupRuleTarget | null =
    isEditing || !scopeReady
      ? null
      : { productId: scopeProductId, categoryId: category, brandId: brand };
  const { rule: ruleAtTarget, isChecking: isCheckingTarget } = useRuleAtTarget(target);
  const clashType = ruleAtTarget ? ruleTypeOf(ruleAtTarget) : null;
  const blockedByMarkup = clashType === "MARKUP";

  // ── Replace (ask 41) ────────────────────────────────────────────────
  // Offered on a new all-products rule, and on editing the active one.
  const canReplace = isAll && (!initial || initial.isActive);
  const toReplace = useMemo(() => rulesToReplace(rules, initial?.id), [rules, initial?.id]);
  const replaceOn = canReplace && replace && isActive && toReplace.length > 0;

  // ── Live impact ─────────────────────────────────────────────────────
  const previewInput: MarkupPreviewInput | null =
    scopeReady && pctValid
      ? {
          categoryId: category,
          brandId: brand,
          scopeProductId,
          markupPercentage: pct,
          applyTo: APPLY_TO,
        }
      : null;
  const previewKey = JSON.stringify(previewInput);
  const debouncedKey = useDebouncedValue(previewKey, PREVIEW_DEBOUNCE_MS);
  const debouncedInput = useMemo(
    () => JSON.parse(debouncedKey) as MarkupPreviewInput | null,
    [debouncedKey],
  );
  const impact = useMarkupImpact(debouncedInput);
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
    const rows: ImpactRow[] = impact.data.variants.map((v) => ({
      id: v.variantId,
      name: v.productName,
      detail: v.variantName,
      current: v.currentPrice,
      projected: v.projectedPrice,
      covered: !!v.coveredByOtherRule,
    }));
    return {
      rows: sortImpactRows(rows, replaceOn),
      summary: summarizeImpact(rows, replaceOn),
    };
  }, [impact.data, replaceOn]);
  const shownSummary = impactStatus === "ready" ? summary : null;

  // ── Ladder ──────────────────────────────────────────────────────────
  const ladder = selfTier ? productLadder(rules, selfTier, initial?.id, replaceOn) : [];
  const categoryName =
    categories.find((c) => c.id === category)?.name ?? initial?.category?.name;
  const brandName = brands.find((b) => b.id === brand)?.name ?? initial?.brand?.name;
  const selfDetail = isAll
    ? replaceOn
      ? "The only markup left"
      : "Store-wide fallback"
    : isItemScope
      ? (product?.name ?? "Pick a product")
      : [brandName, categoryName].filter(Boolean).join(" · ");

  // ── Title: the rule as a sentence ───────────────────────────────────
  const pctTok = pct > 0 ? <Tok pct>+{pct}%</Tok> : <Tok empty>a %</Tok>;
  const title = isAll ? (
    <>
      Mark up <Tok>all products</Tok> by {pctTok}
      {replaceOn && step !== "done" ? ", and turn off the other markups" : ""}
    </>
  ) : isItemScope ? (
    <>
      Mark up <Tok empty={!product}>{product?.name ?? "one product"}</Tok> by {pctTok}
    </>
  ) : category || brand ? (
    <>
      Mark up <Tok>{categoryName ?? "all categories"}</Tok>,{" "}
      <Tok>{brandName ?? "all brands"}</Tok>, by {pctTok}
    </>
  ) : (
    <>
      Mark up <Tok empty>a category</Tok>, <Tok empty>a brand</Tok>, by {pctTok}
    </>
  );
  const description =
    step === "done"
      ? "Saved. It is now the only standing markup for products."
      : initial
        ? `Editing ${initial.ruleId}. Nothing changes until you update it.`
        : "New markup rule. Nothing changes until you create it.";

  // ── Save ────────────────────────────────────────────────────────────
  const buildValues = (): MarkupRuleFormValues | null => {
    if (!isEditing && !scopeReady) {
      setError(
        isItemScope
          ? "Pick a product."
          : "Pick a category or a brand, or choose All products.",
      );
      return null;
    }
    const parsed = markupRuleFormSchema.safeParse({
      categoryId: category,
      brandId: brand,
      productId: scopeProductId,
      markupPercentage: Number(percentage),
      applyTo: APPLY_TO,
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

  const save = (values: MarkupRuleFormValues) => {
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
                { value: result.replaced.variantsRepriced, label: "variants repriced" },
                { value: result.replaced.variantsReset, label: "set to base price" },
                { value: result.replaced.rulesReplaced.length, label: "markups turned off" },
              ]}
              rows={result.rows}
            />
            <MarkupDialogFooter>
              <FooterNote>Deals, hunts and flash sales kept running.</FooterNote>
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
                        tier={PRODUCT_TIER_LABEL[tierOf(initial)]}
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
                        {isAll && <AllScopeNote noun="product" label="All products" />}
                        {isItemScope && (
                          <ItemScopePicker
                            label="Product"
                            noun="products"
                            selected={product}
                            onSelect={setProduct}
                            onClear={() => setProduct(null)}
                            onTermChange={setProductTerm}
                            results={productResults}
                            isFetching={isSearchingProducts}
                            hint="This percentage applies to the exact product, overriding any category or brand rule."
                          />
                        )}
                        {isTaxonomy && (
                          <div className="grid gap-3 sm:grid-cols-2 max-sm:gap-2.5">
                            <Field label="Category">
                              <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="h-10 w-full">
                                  <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={ALL}>All categories</SelectItem>
                                  {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Field>
                            <Field label="Brand">
                              <Select value={brandId} onValueChange={setBrandId}>
                                <SelectTrigger className="h-10 w-full">
                                  <SelectValue placeholder="All brands" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={ALL}>All brands</SelectItem>
                                  {brands.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>
                                      {b.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Field>
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
                      min={MARKUP_MIN_PERCENT}
                      max={MARKUP_MAX_PERCENT}
                      note={`Applies to the selling price, ${MARKUP_MIN_PERCENT} to ${MARKUP_MAX_PERCENT}%.`}
                    />
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
                          New and edited products get this price at once.
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
                      rows={ladder}
                      selfDetail={selfDetail}
                      replace={replaceOn}
                    />
                  ) : (
                    <section>
                      <h3 className="text-sm font-semibold text-foreground">Where it sits</h3>
                      <p className="mt-2.5 text-sm text-muted-foreground">
                        Pick a category or a brand to see where this rule sits.
                      </p>
                    </section>
                  )}
                  <ImpactSection
                    id={impactId}
                    status={impactStatus}
                    updating={previewKey !== debouncedKey || impact.isFetching}
                    errorMessage={impactError?.message}
                    missingMessage="No active products match this scope yet."
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
                    changing != null ? `${changing.toLocaleString("en-NG")} variant${changing === 1 ? "" : "s"}` : "their variants"
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
 *   For the "All products" scope that means the store already has its one
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
  rule: MarkupRule;
  type: "MARKUP" | "DISCOUNT";
  percentage: number;
  isAll: boolean;
}) {
  const isDeal = type === "DISCOUNT";
  const expiry = markupRuleExpiry(rule.expiresAt);
  const name = rule.notes?.trim();

  return (
    <div
      role="alert"
      className={
        isDeal
          ? "rounded-lg border border-warning/50 bg-warning/10 p-3 space-y-1"
          : "rounded-lg border border-destructive/50 bg-destructive/10 p-3 space-y-1"
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
            ? `An “All products” rule already exists: +${rule.markupPercentage}%`
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
            ? `Only one can exist, active or not (${rule.ruleId}). Edit that rule to change it.`
            : `Only one rule can sit on a scope, active or not (${rule.ruleId}). Edit that rule to change it, or pick a more specific scope.`}
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
