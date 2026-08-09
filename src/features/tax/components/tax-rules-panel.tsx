"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";

import type {
  AnyTaxRule,
  TaxonomyOption,
  TaxRuleUpdateInput,
} from "../types/tax";
import { rateToNumber, scopeLabel } from "../utils/tax-format";
import { TaxRulesTable, type TaxRuleRow } from "./tax-rules-table";
import {
  TaxRuleFormDialog,
  type TaxRuleFormSubmit,
} from "./tax-rule-form-dialog";

interface TaxRulesPanelProps {
  kind: "product" | "part";
  rules: AnyTaxRule[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  categories: TaxonomyOption[];
  brands: TaxonomyOption[];
  partTypes: TaxonomyOption[];
  createRule: (values: TaxRuleFormSubmit) => Promise<unknown>;
  updateRule: (id: string, values: TaxRuleUpdateInput) => Promise<unknown>;
  deleteRule: (id: string) => Promise<unknown>;
  isSubmitting: boolean;
  isDeleting: boolean;
}

/**
 * The table + create/edit dialog + delete confirm for one rule kind. Kept
 * presentational: the wrapper components (`ProductTaxRules` / `PartTaxRules`)
 * supply the queries and mutations so this file stays kind-agnostic.
 */
export function TaxRulesPanel({
  kind,
  rules,
  isLoading,
  isError,
  onRetry,
  categories,
  brands,
  partTypes,
  createRule,
  updateRule,
  deleteRule,
  isSubmitting,
  isDeleting,
}: TaxRulesPanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Bumped on every open so the dialog remounts with fresh seed state (the
  // codebase's form-dialog reset pattern — no setState-in-effect sync).
  const [formKey, setFormKey] = useState(0);

  const rulesById = useMemo(() => {
    const map = new Map<string, AnyTaxRule>();
    for (const rule of rules) map.set(rule.id, rule);
    return map;
  }, [rules]);

  const rows: TaxRuleRow[] = useMemo(
    () =>
      rules.map((rule) => ({
        id: rule.id,
        ruleId: rule.ruleId,
        scopeLabel: scopeLabel(rule, kind),
        rate: rateToNumber(rule.rate),
        isActive: rule.isActive,
        notes: rule.notes,
        createdByName: rule.createdBy
          ? `${rule.createdBy.firstName} ${rule.createdBy.lastName}`.trim()
          : "—",
      })),
    [rules, kind],
  );

  const editTarget = editId ? (rulesById.get(editId) ?? null) : null;
  const deleteTarget = deleteId ? (rulesById.get(deleteId) ?? null) : null;

  const openCreate = () => {
    setEditId(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleSubmit = (values: TaxRuleFormSubmit) => {
    const promise = editId
      ? updateRule(editId, {
          rate: values.rate,
          notes: values.notes,
          isActive: values.isActive,
        })
      : createRule(values);

    toast.promise(promise, {
      loading: editId ? "Updating rule…" : "Creating rule…",
      success: editId ? "Tax rule updated." : "Tax rule created.",
      error: (err) =>
        getErrorMessage(
          err,
          editId ? "Failed to update rule." : "Failed to create rule.",
        ),
    });
    promise.then(() => setFormOpen(false)).catch(() => {});
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const promise = deleteRule(deleteId);
    toast.promise(promise, {
      loading: "Deleting rule…",
      success: "Tax rule deleted.",
      error: (err) => getErrorMessage(err, "Failed to delete rule."),
    });
    promise.then(() => setDeleteId(null)).catch(() => {});
  };

  const noun = kind === "part" ? "part" : "product";
  const hasRules = rows.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-xl">
          Charge a different rate for a specific category, brand
          {kind === "part" ? ", or part type" : ""}. The most specific matching
          rule wins; anything without a rule uses the store rate.
        </p>
        {/* Only show the header action once rules exist — the empty state owns
            the first-run CTA, so we don't double up. */}
        {hasRules && (
          <Button
            onClick={openCreate}
            className="shrink-0 rounded-lg bg-primary text-primary-foreground font-black h-9"
          >
            <AppIcon icon="solar:add-circle-linear" className="mr-2 size-4" />
            New Rule
          </Button>
        )}
      </div>

      <Card className="overflow-hidden border bg-card p-0 gap-0">
        <TaxRulesTable
          rows={rows}
          kind={kind}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={setDeleteId}
        />
      </Card>

      <TaxRuleFormDialog
        key={formKey}
        isOpen={formOpen}
        onOpenChange={setFormOpen}
        kind={kind}
        initial={editTarget}
        categories={categories}
        brands={brands}
        partTypes={partTypes}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={`Delete ${noun} tax rule?`}
        description={`This removes the rule for “${
          deleteTarget ? scopeLabel(deleteTarget, kind) : ""
        }”. ${
          kind === "part" ? "Parts" : "Products"
        } in that scope will fall back to the store rate. Existing orders keep the tax already snapshotted at checkout.`}
        confirmText="Delete"
        variant="destructive"
        isPending={isDeleting}
      />
    </div>
  );
}
