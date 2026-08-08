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
import type { PartFormValues } from "../../schemas/part-form";

export function PartStatusSection() {
  const { control } = useFormContext<PartFormValues>();

  return (
    <div className="grid grid-cols-1 gap-4 border-t border-border pt-6 md:grid-cols-2">
      <FormField
        control={control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted/10 p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FormLabel className="text-sm font-semibold">Live Status</FormLabel>
                <Badge
                  variant={field.value ? "success" : "muted"}
                  className="h-4 text-xs"
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
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted/10 p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FormLabel className="text-sm font-semibold">Featured</FormLabel>
                {field.value && (
                  <Badge variant="warning" className="h-4 text-xs">
                    Highlight
                  </Badge>
                )}
              </div>
              <FormDescription className="text-xs">
                Show in featured collections
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
