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
import type { PartFormValues } from "../../schemas/part-form";

export function PartSpecificationsSection() {
  const { control } = useFormContext<PartFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "specifications",
  });

  return (
    <div className="space-y-4 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-warning/15">
            <AppIcon icon="solar:info-circle-linear" className="size-4 text-warning-ink" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Specifications
            </h3>
            <p className="text-xs text-muted-foreground">
              Technical details (e.g. Material: Gorilla Glass 5)
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
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
          <p className="text-xs italic text-muted-foreground">
            No specifications added
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="group flex items-start gap-3">
              <div className="grid flex-1 grid-cols-2 gap-3">
                <FormField
                  control={control}
                  name={`specifications.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Attribute (e.g. Material)"
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
                          placeholder="Value (e.g. Gorilla Glass 5)"
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
                className="h-9 w-9 text-muted-foreground opacity-0 transition-opacity hover:text-destructive-ink group-hover:opacity-100"
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
