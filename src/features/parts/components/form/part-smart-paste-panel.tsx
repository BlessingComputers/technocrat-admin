"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";
import { parsePartsViaAi } from "../../api/ai-parse.client";
import type { Brand, Category, PartType } from "../../types/parts";
import { formatNaira, slugify, type PartFormValues } from "../../schemas/part-form";
import { Card } from "@/components/ui/card";

interface PartSmartPastePanelProps {
  categories: Category[];
  brands: Brand[];
  partTypes: PartType[];
  /**
   * True when the part is being created in the context of a product. The form's
   * `ownerSku` is then the product's part number (the product this part attaches
   * to) and must NOT be overwritten by the parsed listing — only the part's own
   * optional `partNumber` comes from the paste.
   */
  lockOwnerSku: boolean;
}

/**
 * Single-part "Smart paste": paste a similar supplier listing and let AI prefill
 * the form fields (mirrors the bulk paste panel, but writes into one form via
 * react-hook-form instead of adding grid rows). Reuses the parts AI parse route
 * and takes the first parsed listing.
 */
export function PartSmartPastePanel({
  categories,
  brands,
  partTypes,
  lockOwnerSku,
}: PartSmartPastePanelProps) {
  const { setValue } = useFormContext<PartFormValues>();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const parsed = await parsePartsViaAi({
        rawText: text,
        categories,
        brands,
        partTypes,
      });
      const p = parsed[0];
      if (!p) {
        toast.error("Couldn't read a part from that text");
        return;
      }

      const opts = { shouldValidate: true, shouldDirty: true } as const;

      if (p.name) {
        setValue("name", p.name, opts);
        setValue("slug", slugify(p.name), opts);
      }
      // The part's own optional part number (not the product's).
      if (p.partNumber) setValue("partNumber", p.partNumber, opts);
      if (p.partTypeId) setValue("partTypeId", p.partTypeId, opts);
      if (p.categoryId) setValue("categoryId", p.categoryId, opts);
      if (p.brandId) setValue("brandId", p.brandId, opts);
      // ownerSku is the product's part number in product context — keep it.
      if (!lockOwnerSku && p.ownerSku) setValue("ownerSku", p.ownerSku, opts);
      if (p.description) setValue("description", p.description, opts);

      const cost = p.costPrice ?? p.price ?? null;
      if (cost != null) {
        setValue("costPrice", formatNaira(cost), opts);
        // No markup control here — seed the selling price at cost for staff to adjust.
        setValue("price", formatNaira(cost), opts);
      }
      if (typeof p.stockQuantity === "number") {
        setValue("stockQuantity", p.stockQuantity, opts);
      }
      if (p.specifications?.length) {
        setValue(
          "specifications",
          p.specifications.map((s, i) => ({
            name: s.name,
            value: s.value,
            sortOrder: i,
          })),
          opts,
        );
      }

      setText("");
      toast.success("Form prefilled — review before saving");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to parse text"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="gap-0 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary-ink">
          <AppIcon icon="solar:magic-stick-3-linear" className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Smart paste
          </h3>
          <p className="text-xs text-muted-foreground">
            Paste a similar listing — AI prefills the fields below to review
          </p>
        </div>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a similar part listing here…"
        className="h-24 resize-none font-mono text-xs"
      />
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          onClick={handleParse}
          disabled={!text.trim() || loading}
          className="h-9 rounded-lg font-semibold"
        >
          <AppIcon
            icon={loading ? "solar:refresh-linear" : "solar:magic-stick-3-bold"}
            className={loading ? "mr-2 size-4 animate-spin" : "mr-2 size-4"}
          />
          {loading ? "Prefilling…" : "Prefill with AI"}
        </Button>
      </div>
    </Card>
  );
}
