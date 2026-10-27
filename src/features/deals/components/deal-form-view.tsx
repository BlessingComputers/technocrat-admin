"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/error-message";
import { usePermissions } from "@/lib/auth/use-permissions";
import { cn } from "@/lib/utils/cn";

import { useCreateDeal } from "../api/deals.queries";
import { dealFormSchema } from "../schemas/deal-form";
import {
  DEAL_MAX_DISCOUNT_PERCENT,
  DEAL_MAX_TARGETS,
  DEAL_MIN_DISCOUNT_PERCENT,
} from "../types/deals";
import { fromDealTimeInput } from "../utils/deal-timing";
import {
  DealTargetRow,
  draftToTarget,
  emptyTargetDraft,
  type DealTargetDraft,
} from "./deal-target-row";

/**
 * `/pricing/deals/new` — create a deal.
 *
 * A page, not a dialog: the target builder alone can run to a hundred rows.
 *
 * Everything this form creates is a DRAFT. It deliberately has no start-time
 * field — a SCHEDULED deal cannot be edited, cancelled or deleted before it
 * fires (backend ask 28), so a mistyped start time would be armed and
 * unreachable. Staff press Start themselves, from the deal's own page, and
 * until they do no price has moved.
 */
export function DealFormView() {
  const router = useRouter();
  const { can } = usePermissions();
  const createDeal = useCreateDeal();

  const [name, setName] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [notes, setNotes] = useState("");
  const [allowCouponStacking, setAllowCouponStacking] = useState(false);
  const [uniformDiscount, setUniformDiscount] = useState(true);
  const [sharedDiscount, setSharedDiscount] = useState("");
  const [targets, setTargets] = useState<DealTargetDraft[]>([
    emptyTargetDraft(),
  ]);
  const [error, setError] = useState<string | null>(null);

  const canWrite = can("priceMarkup:write");
  const atCap = targets.length >= DEAL_MAX_TARGETS;

  const payloadTargets = useMemo(
    () =>
      targets.map((t) =>
        draftToTarget(t, uniformDiscount ? Number(sharedDiscount) || 0 : null),
      ),
    [targets, sharedDiscount, uniformDiscount],
  );

  const updateTarget = (uid: string, next: DealTargetDraft) =>
    setTargets((rows) => rows.map((r) => (r.uid === uid ? next : r)));

  const removeTarget = (uid: string) =>
    setTargets((rows) => rows.filter((r) => r.uid !== uid));

  const addTarget = () =>
    setTargets((rows) => [
      ...rows,
      // Inherit the last row's catalogue: a deal over eight parts should not
      // need eight clicks on the Part toggle.
      emptyTargetDraft(rows[rows.length - 1]?.entityType ?? "product"),
    ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = dealFormSchema.safeParse({
      name,
      expiresAt: fromDealTimeInput(endsAt),
      allowCouponStacking,
      notes: notes.trim() || undefined,
      targets: targets.map((t, i) => ({
        entityType: t.entityType,
        productId: payloadTargets[i].productId,
        partId: payloadTargets[i].partId,
        categoryId: payloadTargets[i].categoryId,
        brandId: payloadTargets[i].brandId,
        partTypeId: payloadTargets[i].partTypeId,
        discountPercent: Math.abs(payloadTargets[i].markupPercentage),
        label: payloadTargets[i].notes ?? undefined,
      })),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setError(null);

    const promise = createDeal.mutateAsync({
      name: parsed.data.name,
      // Only sent when set. There is no PATCH, so there is no re-save that
      // could silently clear it — the trap the markup forms carry does not
      // reach this screen.
      ...(parsed.data.expiresAt ? { expiresAt: parsed.data.expiresAt } : {}),
      allowCouponStacking: parsed.data.allowCouponStacking,
      ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
      targets: payloadTargets,
    });

    toast.promise(promise, {
      loading: "Saving draft…",
      success: "Draft saved. No prices have changed — press Start when ready.",
      error: (err) => getErrorMessage(err, "Couldn’t save the deal."),
    });

    promise
      .then((deal) => router.push(`/pricing/deals/${deal.id}`))
      .catch(() => {});
  };

  if (!canWrite) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <AppIcon
              icon="solar:lock-keyhole-minimalistic-linear"
              className="size-7"
            />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              No access to create deals
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Running a sale needs the{" "}
              <code className="font-mono">priceMarkup:write</code> permission.
              Ask a super admin to grant it.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="New deal"
        description="A named sale over any mix of products and parts. Saved as a draft — nothing changes price until you start it."
      >
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/pricing/deals">
            <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
            Deals
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="gap-0 space-y-5 p-6">
          <Field
            label="Deal name"
            hint="Shoppers see this on the storefront, so write it for them, not for the back office."
          >
            <Input
              placeholder="e.g. Weekend Laptop Sale"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
            />
          </Field>

          <Field
            label="Ends (optional)"
            hint="Applied to every target when the deal starts. Leave it empty to run until you end it by hand. Prices reset on the next five-minute sweep after this time, not on the minute."
          >
            <Input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="max-w-xs"
            />
          </Field>

          <Field
            label="Internal notes (optional)"
            hint="Staff only. Never shown to shoppers."
          >
            <Textarea
              placeholder="Why this sale is running"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </Field>
        </Card>

        <Card className="gap-0 space-y-3 p-6">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Coupons on this deal
          </h2>
          {/* The default is the API's default, and the off state is the one
              that needs explaining: it rejects the code for the WHOLE basket,
              not just the discounted line. */}
          <ChoiceRow
            selected={allowCouponStacking}
            onSelect={() => setAllowCouponStacking(true)}
            title="Shoppers can still use a discount code"
            detail="A code stacks on top of the sale price."
          />
          <ChoiceRow
            selected={!allowCouponStacking}
            onSelect={() => setAllowCouponStacking(false)}
            title="Block discount codes"
            detail="Blocks codes on the WHOLE basket, not just the sale item, for any cart containing something this deal covers."
          />
        </Card>

        <Card className="gap-0 space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                What is on sale
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {targets.length} of {DEAL_MAX_TARGETS} targets. Products and
                parts can be mixed in one deal.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
              <input
                type="checkbox"
                checked={uniformDiscount}
                onChange={(e) => setUniformDiscount(e.target.checked)}
                className="size-4 accent-primary"
              />
              Same discount for every target
            </label>
          </div>

          {uniformDiscount && (
            <div className="max-w-[14rem] space-y-1.5">
              <Label className="ml-1 text-xs font-semibold text-muted-foreground">
                Discount % ({DEAL_MIN_DISCOUNT_PERCENT}–
                {DEAL_MAX_DISCOUNT_PERCENT})
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                min={DEAL_MIN_DISCOUNT_PERCENT}
                max={DEAL_MAX_DISCOUNT_PERCENT}
                step="0.1"
                placeholder="e.g. 15"
                value={sharedDiscount}
                // Magnitude only — the sign is applied on submit.
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) =>
                  setSharedDiscount(e.target.value.replace(/[^0-9.]/g, ""))
                }
              />
            </div>
          )}

          <div className="space-y-4">
            {targets.map((draft, index) => (
              <DealTargetRow
                key={draft.uid}
                index={index}
                draft={draft}
                onChange={(next) => updateTarget(draft.uid, next)}
                onRemove={() => removeTarget(draft.uid)}
                canRemove={targets.length > 1}
                uniformDiscount={uniformDiscount}
                sharedDiscount={sharedDiscount}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addTarget}
            disabled={atCap}
            title={
              atCap ? `A deal takes at most ${DEAL_MAX_TARGETS} targets` : undefined
            }
            className="h-10 w-full rounded-lg font-medium"
          >
            <AppIcon icon="solar:add-circle-linear" className="mr-2 size-4" />
            Add another target
          </Button>
        </Card>

        {error && (
          <p className="text-sm font-medium text-destructive-ink">{error}</p>
        )}

        {/* The one-way door, stated once and next to the button that walks
            through it. There is no PATCH and no DELETE on a deal. */}
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium text-muted-foreground">
            A saved draft can’t be edited or deleted — the backend has no route
            for either yet. Check the name and the targets before you save. What
            you can always do is leave it unstarted, in which case no price ever
            moves.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/pricing/deals")}
            className="h-11 flex-1 rounded-lg font-medium text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createDeal.isPending}
            className="h-11 flex-[2] rounded-lg bg-primary font-semibold text-primary-foreground"
          >
            {createDeal.isPending ? "Saving…" : "Save draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * A two-option chooser, built from buttons because the project has no
 * radio-group primitive. `role="radio"` + `aria-checked` keeps it announced as
 * the radio pair it looks like.
 */
function ChoiceRow({
  selected,
  onSelect,
  title,
  detail,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary/50 bg-primary/[0.06]"
          : "border-border hover:bg-muted/30",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
      >
        {selected && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {detail}
        </span>
      </span>
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="ml-1 text-xs font-semibold text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="ml-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
