"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import type { ProductFormValues } from "../../schemas/product-form";

export function SpecificationsSection() {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "specifications",
  });

  return (
    <div className="space-y-4 pt-6 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 bg-warning/15 rounded-full flex items-center justify-center">
            <AppIcon icon="solar:info-circle-linear" className="size-4 text-warning-ink" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Product Specifications
            </h3>
            <p className="text-xs text-muted-foreground">
              Technical details (e.g. RAM: 16GB, OS: Windows 11)
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => append({ name: "", value: "", sortOrder: fields.length })}
        >
          <AppIcon icon="solar:add-circle-linear" className="size-3.5" />
          Add Spec
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 flex items-center justify-center text-center bg-muted/20">
          <p className="text-xs text-muted-foreground italic">
            No specifications added
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3 group">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <FormField
                  control={control}
                  name={`specifications.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Attribute (e.g. Color)"
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`specifications.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Value (e.g. Silver)"
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive-ink opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => remove(index)}
              >
                <AppIcon icon="solar:trash-bin-trash-linear" className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
