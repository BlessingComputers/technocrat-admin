"use client";

import {
  useCreatePartTaxRule,
  useDeletePartTaxRule,
  usePartTaxRules,
  useTaxBrands,
  useTaxCategories,
  useTaxPartTypes,
  useUpdatePartTaxRule,
} from "../api/tax.queries";
import type { TaxRuleUpdateInput } from "../types/tax";
import { TaxRulesPanel } from "./tax-rules-panel";
import type { TaxRuleFormSubmit } from "./tax-rule-form-dialog";

/** Part tax-rules section — wires the part-rule queries to the panel. */
export function PartTaxRules() {
  const { data: rules = [], isLoading, isError, refetch } = usePartTaxRules();
  const { data: categories = [] } = useTaxCategories();
  const { data: brands = [] } = useTaxBrands();
  const { data: partTypes = [] } = useTaxPartTypes();

  const createRule = useCreatePartTaxRule();
  const updateRule = useUpdatePartTaxRule();
  const deleteRule = useDeletePartTaxRule();

  return (
    <TaxRulesPanel
      kind="part"
      rules={rules}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      categories={categories}
      brands={brands}
      partTypes={partTypes}
      createRule={(values: TaxRuleFormSubmit) =>
        createRule.mutateAsync({
          // partId is mutually exclusive with category/brand/partType (backend
          // refine) — the form emits only one side, so passing all with the
          // unused ones undefined is safe.
          partId: values.partId,
          categoryId: values.categoryId,
          brandId: values.brandId,
          partTypeId: values.partTypeId,
          rate: values.rate,
          notes: values.notes,
          isActive: values.isActive,
        })
      }
      updateRule={(id: string, data: TaxRuleUpdateInput) =>
        updateRule.mutateAsync({ id, data })
      }
      deleteRule={(id: string) => deleteRule.mutateAsync(id)}
      isSubmitting={createRule.isPending || updateRule.isPending}
      isDeleting={deleteRule.isPending}
    />
  );
}
