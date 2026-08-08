"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { formatNaira, type PartFormValues } from "../../schemas/part-form";

export function PartPricingSection() {
  const { control } = useFormContext<PartFormValues>();

  return (
    <div className="space-y-4 border-t border-border pt-6">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Pricing &amp; Stock
        </h3>
        <p className="text-xs text-muted-foreground">
          Leave the selling price empty for &ldquo;price on request&rdquo;
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField
          control={control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Selling Price</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder="On request"
                  value={field.value}
                  onChange={(e) => field.onChange(formatNaira(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="compareAtPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compare-at Price</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder="₦0"
                  value={field.value}
                  onChange={(e) => field.onChange(formatNaira(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="costPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost Price</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder="₦0"
                  value={field.value}
                  onChange={(e) => field.onChange(formatNaira(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="stockQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="isInStock"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted/10 p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <FormLabel className="text-sm font-semibold">In Stock</FormLabel>
                  <Badge
                    variant={field.value ? "success" : "muted"}
                    className="h-4 text-xs"
                  >
                    {field.value ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <FormDescription className="text-xs">
                  Sellable to customers
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
