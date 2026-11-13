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
import { flattenCategoryTree } from "@/lib/utils/markup-coverage";
import {
  MarkupCoverageView,
  RuleItemsLine,
  type RuleAction,
} from "@/components/shared/markup-coverage/markup-coverage-view";

import {
  usePartCategories,
  usePartBrands,
  usePartTypes,
} from "../../api/parts.queries";
import {
  usePartMarkupRules,
  useCreatePartMarkupRule,
  useUpdatePartMarkupRule,
  useDeletePartMarkupRule,
  useResetPartMarkupRule,
  useCancelPartMarkupRule,
  usePartMarkupImpact,
} from "../../api/pricing.queries";
import { partRuleTypeOf, type PartMarkupRule } from "../../types/pricing";
import type { PartMarkupRuleFormValues } from "../../schemas/markup-rule-form";
import { MarkupRuleFormDialog } from "./markup-rule-form-dialog";
import { MarkupApplyDialog } from "./markup-apply-dialog";
import {
  PART_TIERS,
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
 * `createPartMarkupRule` refuses one with a real `409
 * MARKUP_RULE_SCOPE_CONFLICT` whose message names the blocking rule ("… (rule:
 * PMR-1234). Update it instead."), and that message is the only place the id
 * appears; there is no structured `conflictingRuleId`. So show it verbatim
 * rather than paraphrasing it.
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

/** Part markup-rules management (Parts half of `/pricing/markup`). */
export function PartsPricingView() {
  // Every rule, deals included: deals are negative rules in the same tiers,
  // so the coverage map must see them (a deal can lose to a stronger markup).
  // Deals are still managed on /pricing/deals; their rows link there.
  const { data: allRules, isLoading, isError, isFetching, refetch } =
    usePartMarkupRules();
  const { data: categories = [] } = usePartCategories();
  // The form dialog's ladder and replace list keep the MARKUP-only list.
  const rules = useMemo(
    () => (allRules ?? []).filter((r) => partRuleTypeOf(r) === "MARKUP"),
    [allRules],
  );
  const byId = useMemo(() => new Map((allRules ?? []).map((r) => [r.id, r])), [allRules]);
  const coverageRules = useMemo(() => (allRules ?? []).map(toCoverageRule), [allRules]);
  const rows = useMemo(
    () => flattenCategoryTree(categories, (c) => c.partCount ?? 0),
    [categories],
  );
  const { data: brands = [] } = usePartBrands();
  const { data: partTypes = [] } = usePartTypes();

  const createRule = useCreatePartMarkupRule();
  const updateRule = useUpdatePartMarkupRule();
  const deleteRule = useDeletePartMarkupRule();
  const resetRule = useResetPartMarkupRule();
  const cancelRule = useCancelPartMarkupRule();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PartMarkupRule | null>(null);
  const [applyTarget, setApplyTarget] = useState<PartMarkupRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartMarkupRule | null>(null);
  const [resetTarget, setResetTarget] = useState<PartMarkupRule | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PartMarkupRule | null>(null);

  // Bumped on every open so the dialog remounts with fresh seed state (the
  // codebase's form-dialog reset pattern, no setState-in-effect sync).
  const [formKey, setFormKey] = useState(0);

  const openCreate = () => {
    setEditTarget(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  // Returns the save so the dialog can close itself, or show what a replace
  // turned off. A rejection keeps it open; the toast says why.
  const handleSubmit = (
    values: PartMarkupRuleFormValues,
  ): Promise<PartMarkupRule> => {
    const replaceExisting = values.replaceExisting || undefined;
    if (editTarget) {
      const promise = updateRule.mutateAsync({
        id: editTarget.id,
        data: {
          markupPercentage: values.markupPercentage,
          applyTo: values.applyTo,
          notes: values.notes || undefined,
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
          rule.replaced ? `Rule updated. ${replaceSummary(rule.replaced)}` : "Rule updated.",
        error: (err) => getErrorMessage(err, "Failed to update rule."),
      });
      return promise;
    }
    const promise = createRule.mutateAsync({
      categoryId: values.categoryId || undefined,
      brandId: values.brandId || undefined,
      partTypeId: values.partTypeId || undefined,
      partId: values.partId || undefined,
      markupPercentage: values.markupPercentage,
      applyTo: values.applyTo,
      notes: values.notes || undefined,
      isActive: values.isActive,
      replaceExisting,
    });
    toast.promise(promise, {
      loading: replaceExisting ? "Creating rule and repricing…" : "Creating rule…",
      success: (rule) =>
        rule.replaced
          ? `Rule created. ${replaceSummary(rule.replaced)}`
          : "Rule created. Use Preview & Apply to reprice existing parts.",
      error: createErrorMessage,
    });
    promise.catch(() => refetch());
    return promise;
  };

  const openEdit = (rule: PartMarkupRule) => {
    setEditTarget(rule);
    setFormKey((k) => k + 1);
    setFormOpen(true);
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

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const promise = deleteRule.mutateAsync(deleteTarget.id);
    toast.promise(promise, {
      loading: "Deleting rule…",
      success: "Rule deleted. Adjusted prices are unchanged.",
      error: (err) => getErrorMessage(err, "Failed to delete rule."),
    });
    promise.then(() => setDeleteTarget(null)).catch(() => {});
  };

  const confirmReset = () => {
    if (!resetTarget) return;
    const promise = resetRule.mutateAsync(resetTarget.id);
    toast.promise(promise, {
      loading: "Resetting prices to base…",
      success: ({ partsReset }) =>
        `Prices reset (rule still active) — ${resetSummary(partsReset)}`,
      error: (err) => getErrorMessage(err, "Failed to reset prices."),
    });
    promise.then(() => setResetTarget(null)).catch(() => {});
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const promise = cancelRule.mutateAsync(cancelTarget.id);
    toast.promise(promise, {
      loading: "Cancelling rule…",
      success: (res) => `Rule cancelled — ${cancelSummary(res)}`,
      error: (err) => getErrorMessage(err, "Failed to cancel rule."),
    });
    promise.then(() => setCancelTarget(null)).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parts markup"
        description="Standing markup rules, strongest first, and what each part sells at. Sales live under Deals."
      >
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium max-sm:hidden">
          <Link href="/catalogues/parts">
            <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
            Parts
          </Link>
        </Button>
        <Button
          onClick={openCreate}
          className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground max-sm:flex-1"
        >
          <AppIcon icon="solar:add-circle-linear" className="mr-2 size-5" />
          New rule
        </Button>
      </PageHeader>

      <MarkupCoverageView
        kind="parts"
        rules={coverageRules}
        rows={rows}
        tiers={PART_TIERS}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        renderItems={(r) => <RuleItems ruleId={r.id} />}
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
        partTypes={partTypes}
        rules={rules}
        onSubmit={handleSubmit}
        isSubmitting={createRule.isPending || updateRule.isPending}
      />

      <MarkupApplyDialog rule={applyTarget} onClose={() => setApplyTarget(null)} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete markup rule?"
        description={`Removes the rule for “${deleteTarget ? ruleScopeLabel(deleteTarget) : ""}”. Prices already adjusted are NOT reverted.`}
        confirmText="Delete"
        variant="destructive"
        isPending={deleteRule.isPending}
      />

      <ConfirmModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={confirmReset}
        title="Reset prices (keep rule active)?"
        description={`Sets the parts that “${resetTarget ? ruleScopeLabel(resetTarget) : ""}” prices to base price, but leaves the rule ACTIVE — new/edited parts get the markup re-applied. Parts priced by a deal or a more specific rule are not touched. For a permanent undo, use “Cancel rule”.`}
        confirmText="Reset prices"
        isPending={resetRule.isPending}
      />

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel this rule?"
        description={`Deactivates the rule for “${cancelTarget ? ruleScopeLabel(cancelTarget) : ""}”. Each part it prices moves to the next rule that matches it (for example a brand rule or the all-parts rule), or back to base price when no other rule matches. Parts priced by a deal or a more specific rule are not touched. The rule is kept for audit.`}
        confirmText="Cancel rule"
        isPending={cancelRule.isPending}
      />
    </div>
  );
}

/** "Prices N parts now", loaded when the rule opens. */
function RuleItems({ ruleId }: { ruleId: string }) {
  const { data, isLoading, isError } = usePartMarkupImpact({ ruleId });
  if (isError) return null;
  return (
    <RuleItemsLine
      loading={isLoading}
      count={data?.totalParts}
      other={data?.coveredByOtherRuleCount}
      noun="part"
    />
  );
}
