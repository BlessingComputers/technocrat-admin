"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppIcon } from "@/components/shared/app-icon";
import { ItemScopePicker } from "@/components/shared/item-scope-picker";
import {
  usePromotionBrandOptions,
  usePromotionCategoryOptions,
  usePromotionProductSearch,
  useStorefrontPages,
} from "../api/promotions.queries";
import {
  buildBrandPath,
  buildCategoryPath,
  normalizeDestination,
  parseDestination,
  validateDestination,
  type DestinationKind,
} from "../utils/slide-destination";
import type { PromotionSlide } from "../types/promotions";

/**
 * One slide's caption and destination.
 *
 * `kind` is editor state, not a stored column — the backend has only
 * `productSlug` and `externalUrl` (see `utils/slide-destination.ts` for how the
 * other four kinds are encoded into the second one). It lives on the value
 * anyway so the parent can validate a half-finished pick before saving, which
 * a derived kind could not express: "brand mode with nothing chosen yet" and
 * "no link" are the same two null columns.
 */
export interface SlideLinkValue {
  description: string;
  kind: DestinationKind;
  /** The product's SLUG (not a DB id) — what the backend field expects. */
  productSlug: string | null;
  productName: string | null;
  /** Path or URL, for the category, brand, page and external kinds. */
  externalUrl: string | null;
  /** Display name of the chosen category or brand, for the summary line. */
  targetName: string | null;
}

export const EMPTY_SLIDE_LINK: SlideLinkValue = {
  description: "",
  kind: "none",
  productSlug: null,
  productName: null,
  externalUrl: null,
  targetName: null,
};

const KIND_OPTIONS: Array<{ value: DestinationKind; label: string }> = [
  { value: "none", label: "No link — decorative banner" },
  { value: "product", label: "A product" },
  { value: "category", label: "A category" },
  { value: "brand", label: "A brand" },
  { value: "page", label: "A page on this site" },
  { value: "external", label: "An external URL" },
];

/** Read a saved slide back into editor state, kind and all. */
export function slideToLinkValue(slide: PromotionSlide): SlideLinkValue {
  const parsed = parseDestination({
    productSlug: slide.productSlug ?? null,
    externalUrl: slide.externalUrl ?? null,
  });
  return {
    description: slide.description ?? "",
    kind: parsed.kind,
    productSlug: parsed.kind === "product" ? parsed.slug : null,
    // The slug is all a reopened slide carries; the picker shows it until the
    // editor swaps in a real name.
    productName: parsed.kind === "product" ? parsed.slug : null,
    externalUrl: parsed.kind === "product" ? null : parsed.value || null,
    targetName: parsed.slug,
  };
}

/** Why this slide cannot be saved yet, or null. */
export function slideLinkError(value: SlideLinkValue): string | null {
  return validateDestination(value.kind, {
    productSlug: value.productSlug,
    externalUrl: value.externalUrl,
  });
}

/** One line of plain English for a slide's destination, or null when it has none. */
export function describeSlideLink(value: SlideLinkValue): string | null {
  switch (value.kind) {
    case "product":
      return value.productName ? `links to ${value.productName}` : null;
    case "category":
      return value.targetName ? `links to the ${value.targetName} category` : null;
    case "brand":
      return value.targetName ? `links to ${value.targetName}` : null;
    case "page":
      return value.externalUrl ? `links to ${value.externalUrl}` : null;
    case "external":
      return value.externalUrl ? "links off-site (opens a new tab)" : null;
    default:
      return null;
  }
}

/**
 * Caption + destination for one slide — shared by the pending-upload queue and
 * the edit-existing-slide form.
 *
 * A slide points at one thing or at nothing. Most banners are decorative, so
 * "No link" is the first option and the default, and every other mode says
 * plainly where a tap lands. External URLs open in a new tab; every internal
 * destination stays in the same one, which is why "a page on this site" and "an
 * external URL" are separate modes rather than one free-text field.
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
  const [term, setTerm] = useState("");
  const { data: results = [], isFetching } = usePromotionProductSearch(term);
  // Both lists are gated on their own tab being open, so opening a caption
  // never pulls the category tree or the brand table.
  const { data: categories = [], isLoading: loadingCategories } =
    usePromotionCategoryOptions(value.kind === "category");
  const { data: brands = [], isLoading: loadingBrands } =
    usePromotionBrandOptions(value.kind === "brand");
  // Asked of the storefront, which derives it from its own build, so a page
  // that shipped there is offered here without an edit in this repo.
  const { data: storefrontPages, isLoading: loadingPages } = useStorefrontPages(
    value.kind === "page",
  );

  const error = slideLinkError(value);

  /** Switching modes clears the other mode's columns rather than merging them. */
  const setKind = (kind: DestinationKind) =>
    onChange({
      ...value,
      kind,
      productSlug: null,
      productName: null,
      externalUrl: null,
      targetName: null,
    });

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
        <Label htmlFor={`${idPrefix}-kind`}>Links to</Label>
        <Select
          value={value.kind}
          onValueChange={(next) => setKind(next as DestinationKind)}
        >
          <SelectTrigger id={`${idPrefix}-kind`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.kind === "none" && (
        <p className="text-xs text-muted-foreground">
          The banner shows but does not respond to a tap. Fine for an
          announcement; pick a destination if it is meant to sell something.
        </p>
      )}

      {value.kind === "product" && (
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
      )}

      {value.kind === "category" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-category`}>Category</Label>
          <Select
            value={value.externalUrl ?? ""}
            onValueChange={(path) => {
              const picked = categories.find(
                (c) => buildCategoryPath(c.slug) === path,
              );
              onChange({
                ...value,
                externalUrl: path,
                targetName: picked?.name ?? null,
              });
            }}
          >
            <SelectTrigger id={`${idPrefix}-category`} className="w-full">
              <SelectValue
                placeholder={
                  loadingCategories ? "Loading categories…" : "Choose a category"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem
                  key={category.slug}
                  value={buildCategoryPath(category.slug)}
                >
                  {/* JSX collapses runs of spaces, so nesting is padding. */}
                  <span style={{ paddingInlineStart: category.depth * 12 }}>
                    {category.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Opens the catalog filtered to this category.
          </p>
        </div>
      )}

      {value.kind === "brand" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-brand`}>Brand</Label>
          <Select
            value={value.externalUrl ?? ""}
            onValueChange={(path) => {
              const picked = brands.find((b) => buildBrandPath(b.slug) === path);
              onChange({
                ...value,
                externalUrl: path,
                targetName: picked?.name ?? null,
              });
            }}
          >
            <SelectTrigger id={`${idPrefix}-brand`} className="w-full">
              <SelectValue
                placeholder={loadingBrands ? "Loading brands…" : "Choose a brand"}
              />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.slug} value={buildBrandPath(brand.slug)}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Opens the catalog filtered to this brand.
          </p>
        </div>
      )}

      {value.kind === "page" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-path`}>Page address</Label>
          {loadingPages ? (
            // Same height as the chip row it replaces, so the field below does
            // not jump when the list resolves.
            <div className="flex h-[26px] items-center text-xs text-muted-foreground">
              Loading pages…
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(storefrontPages?.pages ?? []).map((page) => (
                <button
                  key={page.path}
                  type="button"
                  title={page.description ?? page.path}
                  onClick={() =>
                    onChange({ ...value, externalUrl: page.path, targetName: page.label })
                  }
                  aria-pressed={value.externalUrl === page.path}
                  data-on={value.externalUrl === page.path}
                  className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground data-[on=true]:border-primary data-[on=true]:bg-primary/10 data-[on=true]:text-primary-ink"
                >
                  {page.label}
                </button>
              ))}
            </div>
          )}
          <Input
            id={`${idPrefix}-path`}
            placeholder="/product?category=laptops&sort=price_asc"
            value={value.externalUrl ?? ""}
            onChange={(e) =>
              onChange({ ...value, externalUrl: e.target.value, targetName: null })
            }
            onBlur={(e) =>
              onChange({
                ...value,
                externalUrl: normalizeDestination(e.target.value) || null,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Any address on this site, filters included. Pasting a full
            storefront link works — it is trimmed to the path. Opens in the same
            tab.
          </p>
          {storefrontPages?.source === "fallback" && (
            // Says why the row is short, and that the short row is not the
            // limit. Without this the manager reads a missing page as a page
            // they are not allowed to link to.
            <p className="text-xs text-muted-foreground">
              Could not reach the storefront, so these are the common pages
              only. Any other address still works — type its path above.
            </p>
          )}
        </div>
      )}

      {value.kind === "external" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-url`}>External URL</Label>
          <Input
            id={`${idPrefix}-url`}
            type="url"
            placeholder="https://…"
            value={value.externalUrl ?? ""}
            onChange={(e) =>
              onChange({ ...value, externalUrl: e.target.value || null })
            }
          />
          <p className="text-xs text-muted-foreground">
            Opens in a new tab. For anything on this site, use “A page on this
            site” instead so shoppers keep their place.
          </p>
        </div>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-destructive-ink">
          <AppIcon
            icon="solar:danger-triangle-linear"
            className="mt-px size-3.5 shrink-0"
          />
          {error}
        </p>
      )}
    </div>
  );
}
