"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { ProductFormValues } from "../../schemas/product-form";

export function StatusSection() {
  const { control } = useFormContext<ProductFormValues>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border">
      <FormField
        control={control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/10">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FormLabel className="text-sm font-semibold">Live Status</FormLabel>
                <Badge
                  variant={field.value ? "success" : "muted"}
                  className="text-xs h-4"
                >
                  {field.value ? "Active" : "Hidden"}
                </Badge>
              </div>
              <FormDescription className="text-xs">
                Visible to customers
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="isFeatured"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/10">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FormLabel className="text-sm font-semibold">Featured</FormLabel>
                {field.value && (
                  <Badge variant="warning" className="text-xs h-4">
                    Highlight
                  </Badge>
                )}
              </div>
              <FormDescription className="text-xs">
                Show in collections
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
