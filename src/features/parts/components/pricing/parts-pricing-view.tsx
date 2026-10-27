"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/error";
import { getErrorMessage } from "@/lib/api/error-message";

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
} from "../../api/pricing.queries";
import type { PartMarkupRule } from "../../types/pricing";
import type { PartMarkupRuleFormValues } from "../../schemas/markup-rule-form";
import { MarkupRulesTable } from "./markup-rules-table";
import { MarkupRuleFormDialog } from "./markup-rule-form-dialog";
import { MarkupApplyDialog } from "./markup-apply-dialog";
import { ruleScopeLabel } from "./markup-rule-utils";

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
  // MARKUP only. Deals are the same rows with a negative percentage and they
  // live on /pricing/deals; an existing one does not appear here any more.
  const { data: rules = [], isLoading, isError, isFetching, refetch } =
    usePartMarkupRules("MARKUP");
  const { data: categories = [] } = usePartCategories();
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

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleSubmit = (values: PartMarkupRuleFormValues) => {
    if (editTarget) {
      const promise = updateRule.mutateAsync({
        id: editTarget.id,
        data: {
          markupPercentage: values.markupPercentage,
          applyTo: values.applyTo,
          notes: values.notes || undefined,
          isActive: values.isActive,
          // No `expiresAt` or `allowCouponStacking`. Omitting `expiresAt` does
          // clear it server-side, but only on the row being edited, and that
          // row is a markup — the backend ignores both fields on a positive
          // percentage. A deal's expiry is edited from /pricing/deals.
        },
      });
      toast.promise(promise, {
        loading: "Updating rule…",
        success: "Rule updated.",
        error: (err) => getErrorMessage(err, "Failed to update rule."),
      });
      promise.then(() => setFormOpen(false)).catch(() => {});
      return;
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
    });
    toast.promise(promise, {
      loading: "Creating rule…",
      success: "Rule created. Use Preview & Apply to reprice existing parts.",
      error: createErrorMessage,
    });
    promise.then(() => setFormOpen(false)).catch(() => refetch());
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

  const resetMsg = (n: number) =>
    `${n} part${n === 1 ? "" : "s"} reset to base price.`;

  const confirmReset = () => {
    if (!resetTarget) return;
    const promise = resetRule.mutateAsync(resetTarget.id);
    toast.promise(promise, {
      loading: "Resetting prices to base…",
      success: ({ partsReset }) =>
        `Prices reset (rule still active) — ${resetMsg(partsReset)}`,
      error: (err) => getErrorMessage(err, "Failed to reset prices."),
    });
    promise.then(() => setResetTarget(null)).catch(() => {});
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const promise = cancelRule.mutateAsync(cancelTarget.id);
    toast.promise(promise, {
      loading: "Cancelling rule & resetting prices…",
      success: ({ partsReset }) => `Rule cancelled — ${resetMsg(partsReset)}`,
      error: (err) => getErrorMessage(err, "Failed to cancel rule."),
    });
    promise.then(() => setCancelTarget(null)).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Parts Markup"
        description="Standing markup rules, scoped by part, category, brand and type. Sales live under Deals."
      >
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/catalogues/parts">
            <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
            Parts
          </Link>
        </Button>
        <Button
          onClick={openCreate}
          className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
        >
          <AppIcon icon="solar:add-circle-linear" className="mr-2 size-5" />
          New Rule
        </Button>
      </PageHeader>

      <Card className="gap-0 overflow-hidden p-0">
        <MarkupRulesTable
          rules={rules}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          onEdit={(r) => {
            setEditTarget(r);
            setFormOpen(true);
          }}
          onApply={setApplyTarget}
          onResetKeepActive={setResetTarget}
          onCancel={setCancelTarget}
          onDelete={setDeleteTarget}
        />
      </Card>

      <MarkupRuleFormDialog
        isOpen={formOpen}
        onOpenChange={setFormOpen}
        initial={editTarget}
        categories={categories}
        brands={brands}
        partTypes={partTypes}
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
        description={`Resets every part for “${resetTarget ? ruleScopeLabel(resetTarget) : ""}” to base price, but leaves the rule ACTIVE — new/edited parts get the markup re-applied. For a permanent undo, use “Cancel & reset”.`}
        confirmText="Reset prices"
        isPending={resetRule.isPending}
      />

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel rule & reset to base?"
        description={`Deactivates the rule for “${cancelTarget ? ruleScopeLabel(cancelTarget) : ""}” and resets every affected part back to base price. The rule is kept for audit.`}
        confirmText="Cancel & reset"
        isPending={cancelRule.isPending}
      />
    </div>
  );
}
