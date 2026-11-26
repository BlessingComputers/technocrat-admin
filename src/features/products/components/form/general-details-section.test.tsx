// @vitest-environment jsdom
// Regression: editing a product filed under a subcategory saved it under the
// parent, because Radix reset the not-yet-loaded subcategory value to "".
import { describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import type { ProductFormValues } from "../../schemas/product-form";

// The subcategory list is still loading when the edit form sets the saved child.
vi.mock("../../api/products.queries", () => ({
  useSubcategories: () => ({ data: [], isLoading: true }),
}));

import { GeneralDetailsSection } from "./general-details-section";

const DESKTOPS = [{ id: "desktops", name: "Desktops" }];

function Harness({
  onForm,
  defaults = { categoryId: "", subcategoryId: "" },
  categories = DESKTOPS,
}: {
  onForm: (form: UseFormReturn<ProductFormValues>) => void;
  defaults?: { categoryId: string; subcategoryId: string };
  categories?: Array<{ id: string; name: string }>;
}) {
  const form = useForm<ProductFormValues>({
    defaultValues: defaults as ProductFormValues,
  });
  onForm(form);
  return (
    <FormProvider {...form}>
      {/* Radix renders its hidden native <select> only inside a form. */}
      <form>
        <GeneralDetailsSection
          categories={categories}
          brands={[]}
          isEditing
        />
      </form>
    </FormProvider>
  );
}

describe("GeneralDetailsSection", () => {
  it("keeps a saved subcategory while the subcategory list is loading", async () => {
    let form!: UseFormReturn<ProductFormValues>;
    render(<Harness onForm={(f) => (form = f)} />);

    // ProductForm splits the saved categoryId into parent + child after the
    // category tree loads, i.e. after this section has mounted empty.
    act(() => {
      form.setValue("categoryId", "desktops");
      form.setValue("subcategoryId", "all-in-one");
    });
    // Let Radix run its effects, which reset a value it has no item for.
    await act(() => new Promise((r) => setTimeout(r, 0)));

    expect(form.getValues("subcategoryId")).toBe("all-in-one");
  });

  it("keeps the split category set in the render the category list lands", async () => {
    let form!: UseFormReturn<ProductFormValues>;
    const defaults = { categoryId: "all-in-one", subcategoryId: "" };
    // Edit defaults hold the flat saved id (here a subcategory), and the
    // category list is still loading.
    const { rerender } = render(
      <Harness onForm={(f) => (form = f)} defaults={defaults} categories={[]} />,
    );
    await act(() => new Promise((r) => setTimeout(r, 0)));

    // ProductForm's split effect runs as soon as useCategories() settles, so
    // the parent id and its <option> arrive together.
    act(() => {
      rerender(
        <Harness onForm={(f) => (form = f)} defaults={defaults} categories={DESKTOPS} />,
      );
      form.setValue("categoryId", "desktops");
      form.setValue("subcategoryId", "all-in-one");
    });
    await act(() => new Promise((r) => setTimeout(r, 0)));

    expect(form.getValues("categoryId")).toBe("desktops");
    expect(form.getValues("subcategoryId")).toBe("all-in-one");
  });
});
