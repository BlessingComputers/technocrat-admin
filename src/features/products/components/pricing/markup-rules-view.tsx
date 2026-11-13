"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  flattenCategoryTree,
  type CoverageRule,
  type PreviewItem,
} from "@/lib/utils/markup-coverage";
import {
  CellItemsList,
  MarkupCoverageView,
  RuleItemsLine,
  type CellQuery,
  type RuleAction,
} from "@/components/shared/markup-coverage/markup-coverage-view";

import { useCategories, useBrands } from "../../api/products.queries";
import {
  useMarkupRules,
  useCreateMarkupRule,
  useUpdateMarkupRule,
  useDeleteMarkupRule,
  useCancelMarkupRule,
  useResetMarkupRule,
  useResetCategory,
  useMarkupImpact,
} from "../../api/pricing.queries";
import {
  ruleTypeOf,
  type MarkupPreviewVariant,
  type MarkupRule,
  type ResetCategoryInput,
} from "../../types/pricing";
import type { MarkupRuleFormValues } from "../../schemas/markup-rule-form";
import { MarkupRuleFormDialog } from "./markup-rule-form-dialog";
import { MarkupApplyDialog } from "./markup-apply-dialog";
import { CategoryResetDialog } from "./category-reset-dialog";
import {
  PRODUCT_TIERS,
  cancelSummary,
  replaceSummary,
  resetSummary,
  ruleScopeLabel,
  toCoverageRule,
} from "./markup-rule-utils";
import { formatExpiry } from "./sale-timing";

/**
 * Why a create failed, when the server will not say.
 *
 * A duplicate scope is the likeliest cause. Since `59919cd` closed ask 27,
 * `createRule` refuses one with a real `409 MARKUP_RULE_SCOPE_CONFLICT` whose
 * message names the blocking rule ("… (rule: MR-1234). Update it instead."),
 * and that message is the only place the id appears; there is no structured
 * `conflictingRuleId`. So show it verbatim rather than paraphrasing it.
 *
 * Production is behind that fix and still turns the same refusal into a 500
 * with its message replaced, so the 5xx branch keeps the older guess.
 */
function createErrorMessage(err: unknown): string {
  const status = err instanceof ApiError ? err.status : undefined;
  if (status === 409) {
    // `raw` skips the generic 409 default ("This conflicts with existing
    // data…"), which would bury the rule id the server sent.
    const named = getErrorMessage(err, "", { raw: true }).trim();
    if (named && !/^request failed with status/i.test(named)) {
      return `${named} The list has been reloaded.`;
    }
    return "Couldn’t create the rule — a rule already covers this scope. The list has been reloaded; check it and edit that rule instead.";
  }
  if (status !== undefined && status >= 500) {
    return "Couldn’t create the rule — a rule may already cover this scope. The list has been reloaded; check it and edit that rule instead.";
  }
  return getErrorMessage(err, "Failed to create rule.");
}

/** Markup rules management (Products half of `/pricing/markup`). */
export function MarkupRulesView() {
  // Every rule, deals included: deals are negative rules in the same tiers,
  // so the coverage map must see them (a deal can lose to a stronger markup).
  // Deals are still managed on /pricing/deals; their rows link there.
  const {
    data: allRules,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useMarkupRules();
  const { data: categories = [] } = useCategories();
  // The form dialog's ladder and replace list keep the MARKUP-only list.
  const rules = useMemo(
    () => (allRules ?? []).filter((r) => ruleTypeOf(r) === "MARKUP"),
    [allRules],
  );
  const byId = useMemo(() => new Map((allRules ?? []).map((r) => [r.id, r])), [allRules]);
  const coverageRules = useMemo(() => (allRules ?? []).map(toCoverageRule), [allRules]);
  const rows = useMemo(
    () =>
      flattenCategoryTree(categories, (c) => c.subtreeProductCount ?? c.productCount ?? 0),
    [categories],
  );
  const { data: brands = [] } = useBrands();

  const createRule = useCreateMarkupRule();
  const updateRule = useUpdateMarkupRule();
  const deleteRule = useDeleteMarkupRule();
  const cancelRule = useCancelMarkupRule();
  const resetRule = useResetMarkupRule();
  const resetCategory = useResetCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MarkupRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarkupRule | null>(null);
  const [applyTarget, setApplyTarget] = useState<MarkupRule | null>(null);
  // Cancel = deactivate + reset; reset = reset prices but keep the rule active.
  const [cancelTarget, setCancelTarget] = useState<MarkupRule | null>(null);
  const [resetTarget, setResetTarget] = useState<MarkupRule | null>(null);
  const [categoryResetOpen, setCategoryResetOpen] = useState(false);
  // Bumped on every open so the dialog remounts with fresh seed state (the
  // codebase's form-dialog reset pattern — no setState-in-effect sync). Without
  // it the dialog keeps the state it mounted with, so opening Edit on a
  // product-scoped rule leaves the scope mode on "taxonomy" with no product,
  // and the form rejects itself for having no scope.
  const [formKey, setFormKey] = useState(0);

  const openCreate = () => {
    setEditTarget(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (rule: MarkupRule) => {
    setEditTarget(rule);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  // Returns the save so the dialog can close itself, or show what a replace
  // turned off. A rejection keeps it open; the toast says why.
  const handleSubmit = (values: MarkupRuleFormValues): Promise<MarkupRule> => {
    const replaceExisting = values.replaceExisting || undefined;
    if (editTarget) {
      // PATCH accepts only the mutable fields — category/brand are fixed.
      const promise = updateRule.mutateAsync({
        id: editTarget.id,
        data: {
          markupPercentage: values.markupPercentage,
          applyTo: values.applyTo,
          notes: values.notes,
          isActive: values.isActive,
          replaceExisting,
          // No `expiresAt` or `allowCouponStacking`. Omitting `expiresAt` does
          // clear it server-side, but only on the row being edited, and that
          // row is a markup — the backend ignores both fields on a positive
          // percentage. A deal's expiry is edited from /pricing/deals.
        },
      });
      toast.promise(promise, {
        loading: "Updating rule…",
        success: (rule) =>
          rule.replaced
            ? `Rule updated. ${replaceSummary(rule.replaced)}`
            : rule.variantsRecomputed
              ? `Rule updated — ${rule.variantsRecomputed} price${rule.variantsRecomputed === 1 ? "" : "s"} recomputed.`
              : "Rule updated.",
        error: (err) => getErrorMessage(err, "Failed to update rule."),
      });
      return promise;
    }

    const promise = createRule.mutateAsync({
      categoryId: values.categoryId,
      brandId: values.brandId,
      productId: values.productId,
      markupPercentage: values.markupPercentage,
      applyTo: values.applyTo,
      notes: values.notes,
      isActive: values.isActive,
      replaceExisting,
    });
    toast.promise(promise, {
      loading: replaceExisting ? "Creating rule and repricing…" : "Creating rule…",
      success: (rule) =>
        rule.replaced
          ? `Rule created. ${replaceSummary(rule.replaced)}`
          : "Rule created. Use Preview & Apply to reprice existing products.",
      error: createErrorMessage,
    });
    promise.catch(() => refetch());
    return promise;
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const promise = deleteRule.mutateAsync(deleteTarget.id);
    toast.promise(promise, {
      loading: "Deleting rule…",
      success: "Rule deleted. Previously adjusted prices are unchanged.",
      error: (err) => getErrorMessage(err, "Failed to delete rule."),
    });
    promise.then(() => setDeleteTarget(null)).catch(() => {});
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const promise = cancelRule.mutateAsync(cancelTarget.id);
    toast.promise(promise, {
      loading: "Cancelling rule…",
      success: (res) => `Rule cancelled — ${cancelSummary(res)}`,
      // Surfaces typed server messages (e.g. the 429 rate-limit retry window).
      error: (err) => getErrorMessage(err, "Failed to cancel rule."),
    });
    promise.then(() => setCancelTarget(null)).catch(() => {});
  };

  const confirmReset = () => {
    if (!resetTarget) return;
    const promise = resetRule.mutateAsync(resetTarget.id);
    toast.promise(promise, {
      loading: "Resetting prices to base…",
      success: (res) => `Prices reset (rule still active) — ${resetSummary(res)}`,
      error: (err) => getErrorMessage(err, "Failed to reset prices."),
    });
    promise.then(() => setResetTarget(null)).catch(() => {});
  };

  const onAction = (action: RuleAction, { id }: { id: string }) => {
    const rule = byId.get(id);
    if (!rule) return;
    if (action === "apply") setApplyTarget(rule);
    else if (action === "edit") openEdit(rule);
    else if (action === "reset") setResetTarget(rule);
    else if (action === "cancel") setCancelTarget(rule);
    else setDeleteTarget(rule);
  };

  const handleCategoryReset = (input: ResetCategoryInput) => {
    const promise = resetCategory.mutateAsync(input);
    toast.promise(promise, {
      loading: "Resetting category prices to base…",
      success: (res) => resetSummary(res),
      error: (err) => getErrorMessage(err, "Failed to reset prices."),
    });
    promise.then(() => setCategoryResetOpen(false)).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products markup"
        description="Standing markup rules, strongest first, and what each product sells at. Sales live under Deals."
      >
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        <Button asChild variant="outline" className="rounded-lg font-medium h-10 max-sm:hidden">
          <Link href="/catalogues?page=1">
            <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
            Products
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => setCategoryResetOpen(true)}
          className="rounded-lg font-medium h-10 max-sm:hidden"
        >
          <AppIcon icon="solar:rewind-back-linear" className="mr-2 size-4" />
          Reset category prices
        </Button>
        <Button
          onClick={openCreate}
          className="rounded-lg bg-primary text-primary-foreground font-semibold px-5 h-10 max-sm:flex-1"
        >
          <AppIcon icon="solar:add-circle-linear" className="mr-2 size-5" />
          New rule
        </Button>
      </PageHeader>

      <MarkupCoverageView
        kind="products"
        rules={coverageRules}
        rows={rows}
        tiers={PRODUCT_TIERS}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        renderItems={(r) => <RuleItems rule={r} />}
        renderCellItems={(q) => <CellItems query={q} />}
        onAction={onAction}
        onCreate={openCreate}
        formatExpiry={formatExpiry}
      />

      <MarkupRuleFormDialog
        key={formKey}
        isOpen={formOpen}
        onOpenChange={setFormOpen}
        initial={editTarget}
        categories={categories}
        brands={brands}
        rules={rules}
        onSubmit={handleSubmit}
        isSubmitting={createRule.isPending || updateRule.isPending}
      />

      <MarkupApplyDialog
        rule={applyTarget}
        onClose={() => setApplyTarget(null)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete markup rule?"
        description={`This removes the rule for “${deleteTarget ? ruleScopeLabel(deleteTarget) : ""}”. Prices already adjusted by it are NOT reverted.`}
        confirmText="Delete"
        variant="destructive"
        isPending={deleteRule.isPending}
      />

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel this rule?"
        description={`This deactivates the rule for “${cancelTarget ? ruleScopeLabel(cancelTarget) : ""}”. Each variant it prices moves to the next rule that matches it (for example a brand rule or the all-products rule), or back to base price when no other rule matches. Variants priced by a deal, a hunt or a more specific rule are not touched. The rule is kept for audit and can be turned back on later.`}
        confirmText="Cancel rule"
        isPending={cancelRule.isPending}
      />

      <ConfirmModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={confirmReset}
        title="Reset prices (keep rule active)?"
        description={`This sets the variants that “${resetTarget ? ruleScopeLabel(resetTarget) : ""}” prices back to base price, but leaves the rule ACTIVE — new products and price edits will have the markup re-applied, so prices will drift back up. Variants priced by a deal, a hunt or a more specific rule are not touched. For a permanent undo, use “Cancel rule” instead.`}
        confirmText="Reset prices"
        isPending={resetRule.isPending}
      />

      <CategoryResetDialog
        isOpen={categoryResetOpen}
        onOpenChange={setCategoryResetOpen}
        categories={categories}
        brands={brands}
        onSubmit={handleCategoryReset}
        isSubmitting={resetCategory.isPending}
      />
    </div>
  );
}

/** "Prices N variants now" and the list behind it, loaded when the rule opens. */
function RuleItems({ rule }: { rule: CoverageRule }) {
  const { data, isLoading, isError } = useMarkupImpact({ ruleId: rule.id });
  if (isError) return null;
  return (
    <RuleItemsLine
      loading={isLoading}
      count={data?.totalVariants}
      other={data?.coveredByOtherRuleCount}
      noun="variant"
      rule={rule}
      rows={data?.variants.map(toPreviewItem)}
    />
  );
}

const toPreviewItem = (v: MarkupPreviewVariant): PreviewItem => ({
  id: v.variantId,
  name: v.productName,
  detail: [v.variantName, v.sku].filter(Boolean).join(" · ") || null,
  current: v.currentPrice,
  projected: v.projectedPrice,
  cost: v.costPrice,
  covered: !!v.coveredByOtherRule,
});

/**
 * The clicked cell's variants: a dry run at the cell's scope and winning %.
 * Rows a stronger rule prices come back flagged and are left out.
 */
function CellItems({ query }: { query: CellQuery }) {
  const { data, isLoading, isPlaceholderData, isError } = useMarkupImpact({
    categoryId: query.categoryId,
    brandId: query.brandId ?? undefined,
    markupPercentage: query.previewPct,
    applyTo: "PRICE",
  });
  return (
    <CellItemsList
      loading={isLoading || isPlaceholderData}
      failed={isError}
      rows={data?.variants.map(toPreviewItem)}
      previewPct={query.previewPct}
      winner={query.winner}
      hasChildren={query.hasChildren}
      noun="variant"
    />
  );
}
