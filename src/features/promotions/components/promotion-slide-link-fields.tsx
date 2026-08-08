"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ItemScopePicker, ScopeModeToggle } from "@/components/shared/item-scope-picker";
import { usePromotionProductSearch } from "../api/promotions.queries";

export interface SlideLinkValue {
  description: string;
  /** The product's SLUG (not a DB id) — what the backend `productSlug` field expects. */
  productSlug: string | null;
  productName: string | null;
  externalUrl: string | null;
}

export const EMPTY_SLIDE_LINK: SlideLinkValue = {
  description: "",
  productSlug: null,
  productName: null,
  externalUrl: null,
};

/**
 * One slide's caption + link — shared by the pending-upload queue and the
 * edit-existing-slide form. A slide links to EITHER a product or an external
 * URL, never both (mirrors the backend's slide model), or nothing at all
 * (decorative-only slide).
 */
export function PromotionSlideLinkFields({
  value,
  onChange,
  idPrefix,
}: {
  value: SlideLinkValue;
  onChange: (value: SlideLinkValue) => void;
  idPrefix: string;
}) {
  const [mode, setMode] = useState<"product" | "external">(
    value.externalUrl ? "external" : "product",
  );
  const [term, setTerm] = useState("");
  const { data: results = [], isFetching } = usePromotionProductSearch(term);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-description`}>Caption</Label>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="Dell XPS 15 at ₦499,000 — back-to-school special"
          rows={2}
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Links to</Label>
        <ScopeModeToggle
          taxonomyLabel="A product"
          itemLabel="External URL"
          mode={mode === "product" ? "taxonomy" : "item"}
          onChange={(next) => {
            const nextMode = next === "taxonomy" ? "product" : "external";
            setMode(nextMode);
            onChange(
              nextMode === "product"
                ? { ...value, externalUrl: null }
                : { ...value, productSlug: null, productName: null },
            );
          }}
        />
      </div>

      {mode === "product" ? (
        <ItemScopePicker
          label="Product"
          noun="products"
          selected={
            value.productSlug
              ? { id: value.productSlug, name: value.productName ?? value.productSlug }
              : null
          }
          onSelect={(item) =>
            onChange({ ...value, productSlug: item.id, productName: item.name })
          }
          onClear={() => onChange({ ...value, productSlug: null, productName: null })}
          onTermChange={setTerm}
          results={results}
          isFetching={isFetching}
          hint="Tapping the slide takes shoppers to this product's page."
        />
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-url`}>External URL</Label>
          <Input
            id={`${idPrefix}-url`}
            type="url"
            placeholder="https://…"
            value={value.externalUrl ?? ""}
            onChange={(e) => onChange({ ...value, externalUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Opens in a new tab. Leave blank to make this slide decorative only.
          </p>
        </div>
      )}
    </div>
  );
}
