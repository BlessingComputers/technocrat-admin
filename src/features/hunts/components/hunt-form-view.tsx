"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { SkeletonDetailPage } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/error";
import { getErrorMessage } from "@/lib/api/error-message";
import { usePermissions } from "@/lib/auth/use-permissions";

import {
  useCreateHuntCampaign,
  useHuntCampaign,
  useHuntClashRules,
  useHuntDealPercentages,
  useHuntProductPricing,
  useSaveHuntEdits,
} from "../api/hunts.queries";
import { useNow } from "../hooks/use-now";
import {
  groupIssues,
  huntFormSchema,
  type HuntFormIssues,
  type HuntFormValues,
} from "../schemas/hunt-form";
import type { HuntCampaign, HuntCampaignStatus } from "../types/hunts";
import {
  applySlotStart,
  createInitialState,
  editInitialState,
  emptyDropDraft,
  toFormValues,
  type HuntDropDraft,
  type HuntFormState,
} from "../utils/hunt-form-state";
import { planEdits, toCreateRequest } from "../utils/hunt-payload";
import { HUNT_MAX_DROPS, spreadStarts } from "../utils/hunt-schedule";
import { fromHuntTimeInput } from "../utils/hunt-time";
import { HuntDropRow } from "./hunt-drop-row";

/** The backend's own rule: `HUNT_CAMPAIGN_NOT_EDITABLE` for anything else. */
const EDITABLE: HuntCampaignStatus[] = ["DRAFT", "SCHEDULED"];

const NO_ISSUES = groupIssues([]);

/**
 * `/pricing/hunts/new` and `/pricing/hunts/[id]/edit`: one page that builds a
 * whole campaign. The window, the items, their hunt prices, and each item's
 * secret slot.
 *
 * Gated on `huntCampaigns:write`, and it explains itself rather than
 * bouncing, so a deep link from someone without it still reads.
 */
export function HuntFormView({ campaignId }: { campaignId?: string }) {
  const { can } = usePermissions();
  if (!can("huntCampaigns:write")) return <NoWriteAccess />;
  return campaignId ? (
    <EditLoader campaignId={campaignId} />
  ) : (
    <HuntCampaignForm init={createInitialState} />
  );
}

/**
 * Edit mode waits for base prices and stored percentages before the form
 * mounts, because the prefill needs both. Prefilling from the campaign alone
 * would read every scheduled drop as 0% (backend ask 33).
 */
function EditLoader({ campaignId }: { campaignId: string }) {
  const { data: campaign, isLoading, isError, error, refetch } =
    useHuntCampaign(campaignId);
  const deals = campaign?.huntDeals ?? [];
  const pricing = useHuntProductPricing(
    deals.flatMap((d) => (d.productId ? [d.productId] : [])),
  );
  const stored = useHuntDealPercentages(deals);

  if (isLoading || (campaign && (pricing.isLoading || stored.isLoading))) {
    return <SkeletonDetailPage />;
  }

  if (isError || !campaign) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Notice
        icon="solar:gift-linear"
        title={notFound ? "That campaign is gone" : "Couldn’t load this campaign"}
        body={
          notFound
            ? "It may have been deleted, or created against a different environment."
            : "Reading a campaign needs the huntCampaigns:read permission."
        }
      >
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
        <Button asChild variant="ghost">
          <Link href="/pricing/hunts">Back to hunts</Link>
        </Button>
      </Notice>
    );
  }

  if (!EDITABLE.includes(campaign.status)) {
    return (
      <Notice
        icon="solar:lock-keyhole-minimalistic-linear"
        title="This campaign can’t be edited"
        body={`It is ${campaign.status.toLowerCase()}. A campaign can be edited only while it is scheduled, which ends when its window opens.`}
      >
        <Button asChild variant="outline">
          <Link href={`/pricing/hunts/${campaign.id}`}>Back to the campaign</Link>
        </Button>
      </Notice>
    );
  }

  return (
    <HuntCampaignForm
      key={campaign.id}
      edit={{ campaign, storedPercentages: stored.byDeal }}
      init={() => editInitialState(campaign, pricing.pricing, stored.byDeal, Date.now())}
    />
  );
}

interface HuntCampaignFormProps {
  init: () => HuntFormState;
  /** Present in edit mode. The percentages are the Deals' stored targets. */
  edit?: { campaign: HuntCampaign; storedPercentages: Map<string, number> };
}

function HuntCampaignForm({ init, edit }: HuntCampaignFormProps) {
  const router = useRouter();
  const [state, setState] = useState(init);
  // Problems show from the first Save onward, then track every keystroke.
  const [attempted, setAttempted] = useState(false);
  const now = useNow(30_000);

  const createCampaign = useCreateHuntCampaign();
  const saveEdits = useSaveHuntEdits(edit?.campaign.id ?? "");
  const pricing = useHuntProductPricing(
    state.drops.flatMap((d) => (d.product ? [d.product.id] : [])),
  );
  const { data: clashRules } = useHuntClashRules();

  const values = toFormValues(state, pricing.pricing);
  const issues: HuntFormIssues = attempted
    ? (() => {
        const result = huntFormSchema(now).safeParse(values);
        return result.success ? NO_ISSUES : groupIssues(result.error.issues);
      })()
    : NO_ISSUES;

  const pending = createCampaign.isPending || saveEdits.isPending;
  const anyLocked = state.drops.some((d) => d.lockedReason !== null);
  const atCap = state.drops.length >= HUNT_MAX_DROPS;
  const detailHref = edit ? `/pricing/hunts/${edit.campaign.id}` : "/pricing/hunts";

  const setField = (patch: Partial<HuntFormState>) =>
    setState((s) => ({ ...s, ...patch }));

  const updateDrop = (key: string, next: HuntDropDraft) =>
    setState((s) => ({ ...s, drops: s.drops.map((d) => (d.key === key ? next : d)) }));

  const removeDrop = (key: string) =>
    setState((s) => ({ ...s, drops: s.drops.filter((d) => d.key !== key) }));

  const addDrop = () =>
    setState((s) => ({ ...s, drops: [...s.drops, emptyDropDraft()] }));

  const spread = () => {
    const windowStart = fromHuntTimeInput(state.windowStartInput);
    const windowEnd = fromHuntTimeInput(state.windowEndInput);
    if (!windowStart || !windowEnd) {
      toast.error("Set the window first.");
      return;
    }
    const starts = spreadStarts(windowStart, windowEnd, state.drops.length);
    if (!starts) {
      toast.error(
        `The window is too short for ${state.drops.length} drops. Leave at least 11 minutes a drop, plus 15 at the edges.`,
      );
      return;
    }
    setState((s) => ({
      ...s,
      drops: s.drops.map((d, i) =>
        applySlotStart({ ...d, endFollows: true, revealFollows: true }, starts[i]),
      ),
    }));
    toast.success("Spread across the window. Nudge a few by some minutes so the pattern isn’t guessable.");
  };

  const clashFor = (productId: string | undefined) =>
    productId ? (clashRules?.find((r) => r.productId === productId) ?? null) : null;

  const submitCreate = (data: HuntFormValues) => {
    const promise = createCampaign.mutateAsync(toCreateRequest(data));
    toast.promise(promise, {
      loading: "Creating the campaign…",
      success: "Campaign created. Every drop is scheduled.",
      error: (err) => getErrorMessage(err, "Couldn’t create the campaign."),
    });
    promise.then((c) => router.push(`/pricing/hunts/${c.id}`)).catch(() => {});
  };

  const submitEdit = (
    data: HuntFormValues,
    { campaign, storedPercentages }: NonNullable<HuntCampaignFormProps["edit"]>,
  ) => {
    const plan = planEdits(campaign, storedPercentages, data);
    if (!plan.campaign && plan.drops.length === 0) {
      toast("Nothing changed.");
      router.push(detailHref);
      return;
    }
    saveEdits
      .mutateAsync(plan)
      .then(({ failed }) => {
        if (failed.length === 0) {
          toast.success("Changes saved.");
          router.push(detailHref);
          return;
        }
        const numbers = failed.map((f) => f.number).join(", ");
        toast.error(
          `${failed.length === 1 ? "Drop" : "Drops"} ${numbers} didn’t save. ${failed[0].message} Everything else did.`,
          { duration: 8000 },
        );
      })
      .catch((err) =>
        toast.error(getErrorMessage(err, "Couldn’t save the campaign. Nothing changed.")),
      );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (pricing.isLoading) {
      toast.error("Still reading product prices. Try again in a moment.");
      return;
    }
    const parsed = huntFormSchema(now).safeParse(values);
    if (!parsed.success) return; // the problems render inline and by the button
    if (edit) submitEdit(parsed.data, edit);
    else submitCreate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={edit ? `Edit ${edit.campaign.name}` : "New treasure hunt"}
        description={
          edit
            ? `${edit.campaign.campaignId}. Scheduled, so the name, the window and any drop that hasn’t opened can change.`
            : "A public window holding a few secret five-minute drops. Each drop sells one unit at a price you set."
        }
      >
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href={detailHref}>
            <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
            {edit ? "Campaign" : "Hunts"}
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Card className="gap-0 space-y-5 p-6">
          <Field
            label="Campaign name"
            hint="Public. Customers see it on the hunt page."
            errors={issues.name}
          >
            <Input
              placeholder="e.g. Saturday Treasure Hunt"
              value={state.name}
              onChange={(e) => setField({ name: e.target.value })}
              maxLength={150}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Window opens (WAT)" errors={issues.windowStart}>
              <Input
                type="datetime-local"
                value={state.windowStartInput}
                onChange={(e) => setField({ windowStartInput: e.target.value })}
              />
            </Field>
            <Field label="Window closes (WAT)" errors={issues.windowEnd}>
              <Input
                type="datetime-local"
                value={state.windowEndInput}
                onChange={(e) => setField({ windowEndInput: e.target.value })}
              />
            </Field>
          </div>
          <p className="ml-1 text-xs text-muted-foreground">
            The window is public from the moment the campaign exists. Every drop
            has to sit inside it, countdown included.
          </p>
        </Card>

        <Card className="gap-0 space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Drops
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {edit
                  ? "A saved campaign keeps its drops. Change any open drop’s product, price or times here."
                  : `${state.drops.length} of ${HUNT_MAX_DROPS}. One unit of one product each.`}{" "}
                Drop times are secret. Customers see each one only as a
                countdown from its reveal time.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={spread}
              disabled={anyLocked}
              title={
                anyLocked
                  ? "Some drops are locked, so the schedule can't be respread"
                  : "Fill every slot start across the window"
              }
              className="h-9 rounded-lg font-medium"
            >
              <AppIcon icon="solar:magic-stick-3-linear" className="mr-1.5 size-4" />
              Spread evenly
            </Button>
          </div>

          <div className="space-y-4">
            {state.drops.map((draft, index) => (
              <HuntDropRow
                key={draft.key}
                index={index}
                draft={draft}
                onChange={(next) => updateDrop(draft.key, next)}
                onRemove={edit ? undefined : () => removeDrop(draft.key)}
                canRemove={state.drops.length > 1}
                pricing={draft.product ? pricing.pricing.get(draft.product.id) : undefined}
                pricingLoading={pricing.isLoading}
                clash={clashFor(draft.product?.id)}
                errors={issues.drops.get(index) ?? []}
              />
            ))}
          </div>

          {!edit && (
            <Button
              type="button"
              variant="outline"
              onClick={addDrop}
              disabled={atCap}
              title={atCap ? `A campaign takes at most ${HUNT_MAX_DROPS} drops` : undefined}
              className="h-10 w-full rounded-lg font-medium"
            >
              <AppIcon icon="solar:add-circle-linear" className="mr-2 size-4" />
              Add a drop
            </Button>
          )}

          {issues.other.map((message) => (
            <p key={message} className="text-xs font-medium text-destructive-ink">
              {message}
            </p>
          ))}
        </Card>

        {issues.all.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/[0.06] p-4"
          >
            <p className="text-sm font-semibold text-destructive-ink">
              {issues.all.length === 1
                ? "One thing to fix before saving"
                : `${issues.all.length} things to fix before saving`}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-medium text-destructive-ink">
              {issues.all.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {edit
              ? "Each changed drop saves on its own. If one is refused, the rest still save, and the message names the one that didn’t."
              : "Creating schedules every drop at once. There is no draft. Until the window opens you can still edit the name, the window, and any drop that hasn’t opened."}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(detailHref)}
            className="h-11 flex-1 rounded-lg font-medium text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="h-11 flex-[2] rounded-lg bg-primary font-semibold text-primary-foreground"
          >
            {pending ? "Saving…" : edit ? "Save changes" : "Create campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  errors,
  children,
}: {
  label: string;
  hint?: string;
  errors: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="ml-1 text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
      {errors.length > 0
        ? errors.map((message) => (
            <p key={message} className="ml-1 text-xs font-medium text-destructive-ink">
              {message}
            </p>
          ))
        : hint && <p className="ml-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Notice({
  icon,
  title,
  body,
  children,
}: {
  icon: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-2xl items-center justify-center gap-3 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <AppIcon icon={icon} className="size-7" />
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      </div>
      {children && <div className="flex gap-3">{children}</div>}
    </Card>
  );
}

function NoWriteAccess() {
  return (
    <Notice
      icon="solar:lock-keyhole-minimalistic-linear"
      title="No access to run treasure hunts"
      body="Creating or editing a campaign needs the huntCampaigns:write permission. Ask a super admin to grant it."
    >
      <Button asChild variant="outline">
        <Link href="/pricing/hunts">Back to hunts</Link>
      </Button>
    </Notice>
  );
}
