"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils/cn";

import { useTaxSetting, useUpdateTaxSetting } from "../api/tax.queries";
import { taxSettingFormSchema } from "../schemas/tax-setting-form";
import { TAX_RATE_MAX, type TaxSetting } from "../types/tax";
import { formatDate } from "../utils/tax-format";

/**
 * Store-wide tax setting: the master switch + fallback rate. Loads the setting,
 * then hands it to a keyed form so local edit state reseeds cleanly whenever the
 * server value changes (e.g. after a save) — no setState-in-effect sync.
 */
export function TaxSettingPanel() {
  const { data: setting, isLoading, isError, refetch } = useTaxSetting();

  if (isLoading) return <TaxSettingSkeleton />;

  if (isError || !setting) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center py-6">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive-ink">
            <AppIcon icon="solar:danger-circle-linear" className="size-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Couldn’t load the store tax setting
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return <TaxSettingForm key={setting.updatedAt ?? "seed"} setting={setting} />;
}

function TaxSettingForm({ setting }: { setting: TaxSetting }) {
  const updateSetting = useUpdateTaxSetting();

  const [enabled, setEnabled] = useState(setting.enabled);
  const [rate, setRate] = useState(String(setting.rate));
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    enabled !== setting.enabled || Number(rate) !== setting.rate;

  const handleSave = () => {
    const parsed = taxSettingFormSchema.safeParse({
      enabled,
      rate: Number(rate),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the rate.");
      return;
    }
    setError(null);
    const promise = updateSetting.mutateAsync(parsed.data);
    toast.promise(promise, {
      loading: "Saving tax setting…",
      success: "Store tax setting saved.",
      error: (err) => getErrorMessage(err, "Failed to save tax setting."),
    });
  };

  return (
    <Card className="p-6 gap-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Store tax
            </h2>
            <Badge
              variant={enabled ? "success" : "muted"}
              className="font-medium text-xs px-2.5 py-1 rounded-full"
            >
              <AppIcon
                icon={
                  enabled ? "solar:check-circle-bold" : "solar:pause-circle-bold"
                }
                className="size-3"
              />
              {enabled ? "On" : "Off"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            The store-wide rate charged at checkout when no more specific rule
            applies. The master switch turns tax off everywhere — paused rules
            included.
          </p>
        </div>
        {setting.updatedAt && (
          <p className="text-xs font-semibold text-muted-foreground">
            Updated {formatDate(setting.updatedAt)}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        {/* Master switch — a <label> (not a <button>) so it can wrap the Radix
            Switch (itself a button) without nesting buttons; clicking anywhere
            on the row still toggles, since <button> is a labelable element. */}
        <label
          htmlFor="tax-enabled"
          className={cn(
            "flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors",
            enabled
              ? "border-success/40 bg-success/[0.06]"
              : "border-border bg-muted/20",
          )}
        >
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              Tax {enabled ? "enabled" : "disabled"}
            </p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? "Customers are charged tax at checkout."
                : "No tax is charged. Scoped rules stay paused."}
            </p>
          </div>
          <Switch
            id="tax-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </label>

        {/* Rate + save */}
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="tax-rate"
              className="text-xs font-medium text-muted-foreground ml-1"
            >
              Store rate
            </Label>
            <div className="relative">
              <Input
                id="tax-rate"
                type="number"
                inputMode="decimal"
                min={0}
                max={TAX_RATE_MAX}
                step="0.01"
                placeholder="0"
                value={rate}
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) =>
                  setRate(e.target.value.replace(/[^0-9.]/g, ""))
                }
                className="w-28 pr-8 font-mono font-semibold tabular-nums"
                aria-invalid={!!error}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={!isDirty || updateSetting.isPending}
            className="rounded-lg bg-primary text-primary-foreground font-medium h-9 px-5"
          >
            {updateSetting.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-xs font-semibold text-destructive-ink" role="alert">
          {error}
        </p>
      ) : isDirty ? (
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          You have unsaved changes.
        </p>
      ) : null}
    </Card>
  );
}

function TaxSettingSkeleton() {
  return (
    <Card className="p-6 gap-0">
      <div className="space-y-2">
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        <div className="h-4 w-80 max-w-full rounded bg-muted/70 animate-pulse" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="h-[76px] rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-[76px] w-48 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    </Card>
  );
}
