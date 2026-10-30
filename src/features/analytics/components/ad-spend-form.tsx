"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AD_PLATFORMS,
  AD_PLATFORM_LABEL,
  adSpendSchema,
  toAdSpendBody,
  toFormValues,
  type AdSpendFormValues,
} from "../schemas/ad-spend.schema";
import type { AdSpend, AdSpendBody } from "../types/ad-spend";

/** Create and edit share this. The parent owns the mutation and where to go after. */
export function AdSpendForm({
  entry,
  backHref,
  pending,
  submitLabel,
  onSubmit,
}: {
  entry?: AdSpend;
  backHref: string;
  pending: boolean;
  submitLabel: string;
  onSubmit: (body: AdSpendBody) => void;
}) {
  const form = useForm<AdSpendFormValues>({
    resolver: zodResolver(adSpendSchema),
    defaultValues: toFormValues(entry),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(toAdSpendBody(values)))} className="space-y-6">
        <Card>
          <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <FormField
              control={form.control}
              name="campaign"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign</FormLabel>
                  <FormControl>
                    <Input placeholder="black_friday_2026" autoComplete="off" {...field} />
                  </FormControl>
                  <FormDescription>The utm_campaign on the ad&apos;s link, as in Campaign links.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="carousel_a" autoComplete="off" {...field} />
                  </FormControl>
                  <FormDescription>The utm_content, when you log spend per ad.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AD_PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {AD_PLATFORM_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount spent (₦)</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="250,000" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>The same day as From for one day&apos;s spend.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
