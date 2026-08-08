"use client";

import {
  useCreateTaxRule,
  useDeleteTaxRule,
  useTaxBrands,
  useTaxCategories,
  useTaxRules,
  useUpdateTaxRule,
} from "../api/tax.queries";
import type { TaxRuleUpdateInput } from "../types/tax";
import { TaxRulesPanel } from "./tax-rules-panel";
import type { TaxRuleFormSubmit } from "./tax-rule-form-dialog";

/** Product tax-rules section — wires the product-rule queries to the panel. */
export function ProductTaxRules() {
  const { data: rules = [], isLoading, isError, refetch } = useTaxRules();
  const { data: categories = [] } = useTaxCategories();
  const { data: brands = [] } = useTaxBrands();

  const createRule = useCreateTaxRule();
  const updateRule = useUpdateTaxRule();
  const deleteRule = useDeleteTaxRule();

  return (
    <TaxRulesPanel
      kind="product"
      rules={rules}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      categories={categories}
      brands={brands}
      partTypes={[]}
      createRule={(values: TaxRuleFormSubmit) =>
        createRule.mutateAsync({
          // productId is mutually exclusive with category/brand (backend
          // refine) — the form emits only one side, so passing all three
          // (with the unused ones undefined) is safe.
          productId: values.productId,
          categoryId: values.categoryId,
          brandId: values.brandId,
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
