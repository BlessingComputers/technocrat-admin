"use client";

import { useId, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";

import { useFxBrands, useFxCategories, useSetFxLinked } from "../api/fx.queries";
import type { FxAppliesTo, FxLinkResult } from "../types/fx";
import { APPLIES_TO_LABELS, flattenCategories } from "../utils/fx-format";

const ANY = "any";

function plural(n: number, noun: string): string {
  return `${n.toLocaleString("en-GB")} ${noun}${n === 1 ? "" : "s"}`;
}

function resultMessage(res: FxLinkResult): string {
  const verb = res.linked ? "Linked" : "Unlinked";
  const done =
    res.products + res.parts === 0
      ? `Nothing to change: every item in this scope was already ${res.linked ? "linked" : "unlinked"}.`
      : `${verb} ${plural(res.products, "product")} and ${plural(res.parts, "part")}.`;
  return res.standingLink ? `${done} New items in this scope will start linked.` : done;
}

/**
 * Link or unlink a category/brand scope (`POST /pricing/fx/link`). With
 * "Also link new items", the scope is saved as a standing link. SUPER_ADMIN
 * only: the caller renders this for super admins alone.
 */
export function FxLinkForm() {
  const ids = useId();
  const { data: categoryTree = [] } = useFxCategories();
  const { data: brands = [] } = useFxBrands();
  const setLinked = useSetFxLinked();

  const categories = useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const [linked, setLinkedValue] = useState(true);
  const [categoryId, setCategoryId] = useState(ANY);
  const [brandId, setBrandId] = useState(ANY);
  const [standing, setStanding] = useState(true);
  const [appliesTo, setAppliesTo] = useState<FxAppliesTo>("ALL");

  const hasScope = categoryId !== ANY || brandId !== ANY;
  const saveStanding = linked && standing;

  function submit() {
    if (!hasScope) return;
    setLinked.mutate(
      {
        linked,
        categoryIds: categoryId !== ANY ? [categoryId] : undefined,
        brandIds: brandId !== ANY ? [brandId] : undefined,
        ...(saveStanding && { standing: true, appliesTo }),
      },
      {
        onSuccess: (res) => toast.success(resultMessage(res)),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "The link change failed."),
      },
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold text-foreground">Link a category or brand</h2>
          <p className="text-sm text-muted-foreground">
            The change covers every product and part in the scope, subcategories
            included. With both a category and a brand, an item must match both.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-action`} className="text-xs font-semibold text-muted-foreground">
              Change
            </Label>
            <Select
              value={linked ? "link" : "unlink"}
              onValueChange={(v) => setLinkedValue(v === "link")}
            >
              <SelectTrigger id={`${ids}-action`} className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Follow the dollar</SelectItem>
                <SelectItem value="unlink">Stop following the dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-category`} className="text-xs font-semibold text-muted-foreground">
              Category
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id={`${ids}-category`} className="h-10 w-full">
                <SelectValue placeholder="Any category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span style={{ paddingLeft: `${c.depth * 12}px` }}>{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-brand`} className="text-xs font-semibold text-muted-foreground">
              Brand
            </Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger id={`${ids}-brand`} className="h-10 w-full">
                <SelectValue placeholder="Any brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any brand</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {linked ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor={`${ids}-standing`} className="text-sm font-medium text-foreground">
                  Also link new items in this scope
                </Label>
                <p className="text-xs text-muted-foreground">
                  Saves a standing link. Products and parts added to this scope
                  later start linked, from every upload path.
                </p>
              </div>
              <Switch id={`${ids}-standing`} checked={standing} onCheckedChange={setStanding} />
            </div>
            {standing && (
              <div className="space-y-1.5 sm:max-w-xs">
                <Label htmlFor={`${ids}-applies`} className="text-xs font-semibold text-muted-foreground">
                  New items it covers
                </Label>
                <Select value={appliesTo} onValueChange={(v) => setAppliesTo(v as FxAppliesTo)}>
                  <SelectTrigger id={`${ids}-applies`} className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(APPLIES_TO_LABELS) as FxAppliesTo[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {APPLIES_TO_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This choice is for new items only. The items in the scope now
                  are linked either way, products and parts.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Unlinked items keep their current Naira price. Their dollar anchor
            is cleared. A standing link on this scope stays: remove it below so
            new items stop starting linked.
          </p>
        )}

        {linked && (
          <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/[0.06] px-4 py-3">
            <AppIcon icon="solar:danger-triangle-linear" className="mt-0.5 size-4 shrink-0 text-warning-ink" />
            <p className="text-sm text-foreground/80">
              A linked item starts from its current Naira price. Check the prices
              in a scope before you link it, because a wrong price will follow the
              dollar too.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          {!hasScope && (
            <p className="text-xs text-muted-foreground">Pick a category, a brand, or both.</p>
          )}
          <Button onClick={submit} disabled={!hasScope || setLinked.isPending}>
            <AppIcon
              icon={linked ? "solar:link-linear" : "solar:link-broken-linear"}
              className="mr-2 size-4"
            />
            {setLinked.isPending ? "Saving…" : linked ? "Link scope" : "Unlink scope"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
