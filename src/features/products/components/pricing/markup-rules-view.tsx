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
import { getErrorMessage } from "@/lib/api/error-message";

import { useCategories, useBrands } from "../../api/products.queries";
import {
  useMarkupRules,
  useCreateMarkupRule,
  useUpdateMarkupRule,
  useDeleteMarkupRule,
  useCancelMarkupRule,
  useResetMarkupRule,
  useResetCategory,
} from "../../api/pricing.queries";
import type { MarkupRule, ResetCategoryInput } from "../../types/pricing";
import type { MarkupRuleFormValues } from "../../schemas/markup-rule-form";
import { MarkupRulesTable } from "./markup-rules-table";
import { MarkupRuleFormDialog } from "./markup-rule-form-dialog";
import { MarkupApplyDialog } from "./markup-apply-dialog";
import { CategoryResetDialog } from "./category-reset-dialog";
import { ruleScopeLabel } from "./markup-rule-utils";

/** Markup rules management (Products tab of `/pricing`). */
export function MarkupRulesView() {
  const {
    data: rules = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useMarkupRules();
  const { data: categories = [] } = useCategories();
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

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const openEdit = (rule: MarkupRule) => {
    setEditTarget(rule);
    setFormOpen(true);
  };

  const handleSubmit = (values: MarkupRuleFormValues) => {
    if (editTarget) {
      // PATCH accepts only the mutable fields — category/brand are fixed.
      const promise = updateRule.mutateAsync({
        id: editTarget.id,
        data: {
          markupPercentage: values.markupPercentage,
          applyTo: values.applyTo,
          notes: values.notes,
          isActive: values.isActive,
        },
      });
      toast.promise(promise, {
        loading: "Updating rule…",
        success: (rule) =>
          rule.variantsRecomputed
            ? `Rule updated — ${rule.variantsRecomputed} price${rule.variantsRecomputed === 1 ? "" : "s"} recomputed.`
            : "Rule updated.",
        error: (err) => getErrorMessage(err, "Failed to update rule."),
      });
      promise.then(() => setFormOpen(false)).catch(() => {});
      return;
    }

    const promise = createRule.mutateAsync({
      categoryId: values.categoryId,
      brandId: values.brandId,
      productId: values.productId,
      markupPercentage: values.markupPercentage,
      applyTo: values.applyTo,
      notes: values.notes,
      isActive: values.isActive,
    });
    toast.promise(promise, {
      loading: "Creating rule…",
      success: "Rule created. Use Preview & Apply to reprice existing products.",
      error: (err) => getErrorMessage(err, "Failed to create rule."),
    });
    promise.then(() => setFormOpen(false)).catch(() => {});
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

  const resetToast = (variantsReset: number, partsReset: number) =>
    `${variantsReset} variant${variantsReset === 1 ? "" : "s"} and ${partsReset} part${partsReset === 1 ? "" : "s"} reset to base price.`;

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const promise = cancelRule.mutateAsync(cancelTarget.id);
    toast.promise(promise, {
      loading: "Cancelling rule & resetting prices…",
      success: ({ variantsReset, partsReset }) =>
        `Rule cancelled — ${resetToast(variantsReset, partsReset)}`,
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
      success: ({ variantsReset, partsReset }) =>
        `Prices reset (rule still active) — ${resetToast(variantsReset, partsReset)}`,
      error: (err) => getErrorMessage(err, "Failed to reset prices."),
    });
    promise.then(() => setResetTarget(null)).catch(() => {});
  };

  const handleCategoryReset = (input: ResetCategoryInput) => {
    const promise = resetCategory.mutateAsync(input);
    toast.promise(promise, {
      loading: "Resetting category prices to base…",
      success: ({ variantsReset, partsReset }) => resetToast(variantsReset, partsReset),
      error: (err) => getErrorMessage(err, "Failed to reset prices."),
    });
    promise.then(() => setCategoryResetOpen(false)).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Products Pricing"
        description="Percentage markup rules, scoped by category and brand"
      >
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        <Button asChild variant="outline" className="rounded-lg font-medium h-10">
          <Link href="/catalogues?page=1">
            <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
            Products
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => setCategoryResetOpen(true)}
          className="rounded-lg font-medium h-10"
        >
          <AppIcon icon="solar:rewind-back-linear" className="mr-2 size-4" />
          Reset category prices
        </Button>
        <Button
          onClick={openCreate}
          className="rounded-lg bg-primary text-primary-foreground font-semibold px-5 h-10"
        >
          <AppIcon icon="solar:add-circle-linear" className="mr-2 size-5" />
          New Rule
        </Button>
      </PageHeader>

      <Card className="overflow-hidden border bg-card p-0 gap-0">
        <MarkupRulesTable
          rules={rules}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          onEdit={openEdit}
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
        title="Cancel rule & reset to base?"
        description={`This deactivates the rule for “${cancelTarget ? ruleScopeLabel(cancelTarget) : ""}” and resets every affected variant and part back to its base price. The rule is kept for audit and can be re-created later.`}
        confirmText="Cancel & reset"
        isPending={cancelRule.isPending}
      />

      <ConfirmModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={confirmReset}
        title="Reset prices (keep rule active)?"
        description={`This resets every affected variant and part for “${resetTarget ? ruleScopeLabel(resetTarget) : ""}” back to base price, but leaves the rule ACTIVE — new products and price edits will have the markup re-applied, so prices will drift back up. For a permanent undo, use “Cancel rule & reset” instead.`}
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
