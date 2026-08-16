"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppIcon } from "@/components/shared/app-icon";
import {
  promotionFormSchema,
  type PromotionFormValues,
} from "../schemas/promotion-form";
import type { Promotion } from "../types/promotions";

/** `datetime-local` needs "YYYY-MM-DDTHH:mm", not a full ISO string. */
function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface PromotionFormProps {
  promotion?: Promotion;
  onSubmit: (values: {
    title: string;
    description?: string;
    startAt?: string | null;
    endAt?: string | null;
  }) => void;
  isPending: boolean;
  submitLabel: string;
}

export function PromotionForm({
  promotion,
  onSubmit,
  isPending,
  submitLabel,
}: PromotionFormProps) {
  const [values, setValues] = useState<PromotionFormValues>({
    title: promotion?.title ?? "",
    description: promotion?.description ?? "",
    startAt: toLocalInputValue(promotion?.startAt),
    endAt: toLocalInputValue(promotion?.endAt),
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = promotionFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setError(null);
    onSubmit({
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      startAt: parsed.data.startAt
        ? new Date(parsed.data.startAt).toISOString()
        : null,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt).toISOString() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="promo-title">Title</Label>
        <Input
          id="promo-title"
          placeholder="Back-to-School August Sale"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Internal name — shoppers never see it, only the slide images.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="promo-description">Description</Label>
        <Textarea
          id="promo-description"
          placeholder="Notes for your own reference (optional)."
          rows={3}
          value={values.description}
          onChange={(e) =>
            setValues((v) => ({ ...v, description: e.target.value }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="promo-start">Starts</Label>
          <Input
            id="promo-start"
            type="datetime-local"
            value={values.startAt}
            onChange={(e) =>
              setValues((v) => ({ ...v, startAt: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="promo-end">Ends</Label>
          <Input
            id="promo-end"
            type="datetime-local"
            value={values.endAt}
            onChange={(e) => setValues((v) => ({ ...v, endAt: e.target.value }))}
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Leave either blank for no start/end limit. Publishing controls
        visibility separately — a scheduled promotion still needs to be
        published to ever go live.
      </p>

      {error && (
        <p className="text-xs font-semibold text-destructive-ink" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <AppIcon icon="solar:refresh-linear" className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
