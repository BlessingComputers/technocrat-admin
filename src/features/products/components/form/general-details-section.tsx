"use client";

import { useFormContext, useWatch } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useSubcategories } from "../../api/products.queries";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify, type ProductFormValues } from "../../schemas/product-form";

interface GeneralDetailsSectionProps {
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  isEditing: boolean;
}

export function GeneralDetailsSection({
  categories,
  brands,
  isEditing,
}: GeneralDetailsSectionProps) {
  const { control, setValue } = useFormContext<ProductFormValues>();

  // Subcategories depend on the chosen category (the field is disabled until then).
  const categoryId = useWatch({ control, name: "categoryId" });
  const { data: subcategories = [], isLoading: subsLoading } = useSubcategories(
    categoryId ?? "",
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Product Name*</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. HP EliteBook 840 G9"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    // Auto-generate the slug from the name on create only.
                    if (!isEditing) {
                      setValue("slug", slugify(e.target.value), {
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (auto-generated)</FormLabel>
              <FormControl>
                <Input className="bg-muted" readOnly {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category*</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v);
                  // Changing category invalidates the old subcategory — clear it.
                  setValue("subcategoryId", "");
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="subcategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategory</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
                disabled={!categoryId || subsLoading || subcategories.length === 0}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        !categoryId
                          ? "Select a category first"
                          : subsLoading
                            ? "Loading…"
                            : subcategories.length === 0
                              ? "No subcategories"
                              : "Select Subcategory"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="brandId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand*</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Product description (minimum 10 characters)"
                className="resize-none h-24"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
