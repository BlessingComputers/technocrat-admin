"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppIcon } from "@/components/shared/app-icon";
import {
  DEFAULT_PLACEMENT,
  GROUP_LABEL,
  GROUP_ORDER,
  PLACEMENTS,
  PLACEMENTS_BY_GROUP,
  TEMPLATE_LABEL,
  exportGuidance,
  isPlacementKey,
  type PlacementKey,
} from "../constants/placements";
import {
  usePromotionCategoryOptions,
  usePromotions,
} from "../api/promotions.queries";
import {
  promotionFormSchema,
  type PromotionFormValues,
} from "../schemas/promotion-form";
import {
  findConflictingFallback,
  templateChangeWarning,
} from "../utils/placement-change";
import type { Promotion } from "../types/promotions";

/** `datetime-local` needs "YYYY-MM-DDTHH:mm", not a full ISO string. */
function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface PromotionFormSubmit {
  title: string;
  description?: string;
  placement: PlacementKey;
  isFallback: boolean;
  targetCategorySlug: string | null;
  startAt?: string | null;
  endAt?: string | null;
}

interface PromotionFormProps {
  promotion?: Promotion;
  onSubmit: (values: PromotionFormSubmit) => void;
  isPending: boolean;
  submitLabel: string;
}

/** The sentinel a Radix Select needs for "no category" — "" is not allowed. */
const NO_CATEGORY = "__all__";

export function PromotionForm({
  promotion,
  onSubmit,
  isPending,
  submitLabel,
}: PromotionFormProps) {
  const [values, setValues] = useState<PromotionFormValues>({
    title: promotion?.title ?? "",
    description: promotion?.description ?? "",
    // An unknown key on an existing row (a slot the storefront has since
    // dropped) cannot be shown as selected, so the picker opens empty and the
    // creator has to choose — which is the right prompt for an unplaced banner.
    placement: isPlacementKey(promotion?.placement)
      ? promotion.placement
      : promotion
        ? ("" as PlacementKey)
        : DEFAULT_PLACEMENT,
    isFallback: promotion?.isFallback ?? false,
    targetCategorySlug: promotion?.targetCategorySlug ?? null,
    startAt: toLocalInputValue(promotion?.startAt),
    endAt: toLocalInputValue(promotion?.endAt),
  });
  const [error, setError] = useState<string | null>(null);

  const spec = isPlacementKey(values.placement)
    ? PLACEMENTS[values.placement]
    : null;
  const sizes = spec ? exportGuidance(spec.template) : null;
  const isTargetable = Boolean(spec?.targetable);

  // Only pulled once a targetable slot is picked — a homepage banner can never
  // use it, so the tree is not worth fetching for one.
  const { data: categories = [] } = usePromotionCategoryOptions(isTargetable);

  // Everything on the site, so the fallback check can see the whole slot. One
  // page is enough: this list holds campaigns, not orders.
  const { data: allPromotions } = usePromotions({ limit: 100 });

  // Uniqueness is per `(placement, targetCategorySlug)`, not per placement, so
  // laptops and accessories can each have their own evergreen banner (§2.11).
  const conflictingFallback = useMemo(() => {
    if (!spec) return null;
    return findConflictingFallback(allPromotions?.data ?? [], {
      id: promotion?.id,
      placement: values.placement,
      targetCategorySlug: isTargetable
        ? (values.targetCategorySlug ?? null)
        : null,
    });
  }, [
    allPromotions,
    promotion?.id,
    spec,
    isTargetable,
    values.placement,
    values.targetCategorySlug,
  ]);

  const slideCount = promotion?.slides.length ?? 0;
  const templateChange = templateChangeWarning(
    promotion?.placement,
    values.placement,
    slideCount,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = promotionFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    if (parsed.data.isFallback && conflictingFallback) {
      setError(
        `"${conflictingFallback.title}" is already the fallback for this slot. Only one banner can hold that spot.`,
      );
      return;
    }
    setError(null);
    onSubmit({
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      placement: parsed.data.placement,
      isFallback: parsed.data.isFallback,
      // A category on a non-targetable slot would be stored and then silently
      // ignored, so it is dropped rather than carried along.
      targetCategorySlug: isTargetable
        ? parsed.data.targetCategorySlug || null
        : null,
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

      <div className="space-y-1.5">
        <Label htmlFor="promo-placement">Where it appears</Label>
        <Select
          value={values.placement || undefined}
          onValueChange={(next) =>
            setValues((v) => ({
              ...v,
              placement: next as PlacementKey,
              // A slot that cannot be targeted must not keep a stale category.
              targetCategorySlug: PLACEMENTS[next as PlacementKey]?.targetable
                ? v.targetCategorySlug
                : null,
            }))
          }
        >
          <SelectTrigger id="promo-placement" className="w-full">
            <SelectValue placeholder="Choose a slot" />
          </SelectTrigger>
          <SelectContent>
            {GROUP_ORDER.map((group) => (
              <SelectGroup key={group}>
                <SelectLabel>{GROUP_LABEL[group]}</SelectLabel>
                {PLACEMENTS_BY_GROUP[group].map((key) => (
                  <SelectItem key={key} value={key}>
                    {PLACEMENTS[key].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {spec && sizes && (
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {TEMPLATE_LABEL[spec.template]}
            </span>
            <span aria-hidden="true">·</span>
            <span>Desktop {sizes.desktop}</span>
            <span aria-hidden="true">·</span>
            <span>
              {sizes.mobile
                ? `Mobile ${sizes.mobile}`
                : "one file, square at every size"}
            </span>
          </p>
        )}
      </div>

      {templateChange && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-ink">
          <AppIcon icon="solar:crop-linear" className="mt-0.5 size-4 shrink-0" />
          <p>
            That slot is a different shape ({TEMPLATE_LABEL[templateChange.from]}{" "}
            → {TEMPLATE_LABEL[templateChange.to]}).{" "}
            {slideCount === 1
              ? "Your existing slide"
              : `All ${slideCount} existing slides`}{" "}
            will be cropped to fit — re-export at{" "}
            {exportGuidance(templateChange.to).desktop} to be sure nothing
            important is cut off.
          </p>
        </div>
      )}

      {isTargetable && (
        <div className="space-y-1.5">
          <Label htmlFor="promo-category">Show only in</Label>
          <Select
            value={values.targetCategorySlug ?? NO_CATEGORY}
            onValueChange={(next) =>
              setValues((v) => ({
                ...v,
                targetCategorySlug: next === NO_CATEGORY ? null : next,
              }))
            }
          >
            <SelectTrigger id="promo-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>
                Every page in this slot
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.slug} value={category.slug}>
                  {/* JSX collapses runs of spaces, so nesting is padding. */}
                  <span style={{ paddingInlineStart: category.depth * 12 }}>
                    {category.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This slot appears on hundreds of pages. Pick a category to narrow it
            to those, or leave it as-is for all of them.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="promo-fallback"
            className="mt-0.5"
            checked={values.isFallback}
            disabled={Boolean(conflictingFallback)}
            onCheckedChange={(checked) =>
              setValues((v) => ({ ...v, isFallback: checked === true }))
            }
          />
          <div className="space-y-0.5">
            <Label htmlFor="promo-fallback" className="font-normal">
              This is the fallback for this slot
            </Label>
            <p className="text-xs text-muted-foreground">
              It shows only when no other campaign is live here, so the slot is
              never bare and never competes with a real campaign.
            </p>
          </div>
        </div>
        {conflictingFallback && (
          <p className="ml-6.5 text-xs text-warning-ink">
            &ldquo;{conflictingFallback.title}&rdquo; already holds that spot.
            Clear it there first.
          </p>
        )}
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
            <AppIcon
              icon="solar:refresh-linear"
              className="size-4 animate-spin"
            />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
