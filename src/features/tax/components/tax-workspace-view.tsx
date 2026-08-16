"use client";

import { useState } from "react";

import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { usePermissions } from "@/lib/auth/use-permissions";

import { useTaxSetting } from "../api/tax.queries";
import { TaxSettingPanel } from "./tax-setting-panel";
import { ProductTaxRules } from "./product-tax-rules";
import { PartTaxRules } from "./part-tax-rules";
import { Card } from "@/components/ui/card";

type RuleScope = "products" | "parts";

/**
 * The Tax tab of `/pricing`: the store-wide setting on top, then scoped
 * product / part rules under a segmented switch. Gated on `tax:manage` — the
 * backend's 403 is the real boundary; this only decides what to show.
 */
export function TaxWorkspaceView() {
  const { can } = usePermissions();
  const [scope, setScope] = useState<RuleScope>("products");
  // Read here too (shared query cache — no extra request) to flag when scoped
  // rules are paused because the master switch is off.
  const { data: setting } = useTaxSetting();

  if (!can("tax:manage")) {
    return (
      <Card className="items-center justify-center gap-3 py-16 text-center">
        <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <AppIcon icon="solar:lock-keyhole-minimalistic-linear" className="size-7" />
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            No access to tax settings
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Managing store tax needs the <code className="font-mono">tax:manage</code>{" "}
            permission. Ask a super admin to grant it.
          </p>
        </div>
      </Card>
    );
  }

  const taxOff = setting?.enabled === false;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <TaxSettingPanel />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Scoped rules
            </h2>
            <p className="text-sm text-muted-foreground">
              Override the store rate for specific categories, brands, or types.
            </p>
          </div>
          <SegmentedControl scope={scope} onChange={setScope} />
        </div>

        {taxOff && (
          <div className="flex items-start gap-2.5 rounded-lg border border-info/30 bg-info/[0.06] px-4 py-3">
            <AppIcon
              icon="solar:info-circle-bold"
              className="size-4 mt-0.5 shrink-0 text-info-ink"
            />
            <p className="text-sm font-medium text-foreground/80">
              Store tax is off, so these rules are paused — they won’t apply at
              checkout until you enable tax above. You can still add and edit
              them now.
            </p>
          </div>
        )}

        {scope === "products" ? <ProductTaxRules /> : <PartTaxRules />}
      </section>
    </div>
  );
}

function SegmentedControl({
  scope,
  onChange,
}: {
  scope: RuleScope;
  onChange: (scope: RuleScope) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Rule scope"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1"
    >
      <SegmentButton
        active={scope === "products"}
        onClick={() => onChange("products")}
        icon="solar:box-linear"
        label="Products"
      />
      <SegmentButton
        active={scope === "parts"}
        onClick={() => onChange("parts")}
        icon="solar:layers-minimalistic-linear"
        label="Parts"
      />
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3.5 h-8 text-sm font-semibold transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <AppIcon icon={icon} className="size-4" />
      {label}
    </button>
  );
}
