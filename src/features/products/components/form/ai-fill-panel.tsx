"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import type { AiParsedProduct } from "@/lib/ai/product-parser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";
import type { ProductBrand, ProductCategory } from "../../types/products";
import { parseProductsViaAi } from "../../api/ai-parse.client";
import {
  formatNaira,
  slugify,
  type ProductFormValues,
} from "../../schemas/product-form";

interface AiFillPanelProps {
  categories: ProductCategory[];
  brands: ProductBrand[];
}

/**
 * Single-product "AI fill": paste one supplier listing and let the model fill
 * the form for review. Unlike the bulk paste (which produces many rows), this
 * fills the current form's fields. It is **fill-not-clobber** — only fields the
 * model actually returned are written, so on the edit route it won't wipe
 * existing data the listing didn't mention. Status/featured are never touched.
 */
export function AiFillPanel({ categories, brands }: AiFillPanelProps) {
  const form = useFormContext<ProductFormValues>();
  const queryClient = useQueryClient();
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const applyProduct = (p: AiParsedProduct) => {
    const opts = { shouldDirty: true } as const;

    if (p.name) form.setValue("name", p.name, opts);
    if (p.slug || p.name)
      form.setValue("slug", p.slug || slugify(p.name ?? ""), opts);
    if (p.description) form.setValue("description", p.description, opts);
    if (p.categoryId) form.setValue("categoryId", p.categoryId, opts);
    if (p.subcategoryId) form.setValue("subcategoryId", p.subcategoryId, opts);
    if (p.brandId) form.setValue("brandId", p.brandId, opts);

    // Single pricing record (variant concept hidden) — index 0.
    if (p.sku) form.setValue("variants.0.sku", p.sku, opts);
    if (p.sourcingType)
      form.setValue("variants.0.sourcingType", p.sourcingType, opts);
    if (typeof p.stockQuantity === "number")
      form.setValue("variants.0.stockQuantity", p.stockQuantity, opts);
    if (typeof p.price === "number" && p.price > 0) {
      // Parsed price is the supplier (cost) price; seed selling = cost, staff
      // adjust the markup afterwards (mirrors the bulk flow).
      const naira = formatNaira(p.price);
      form.setValue("variants.0.costPrice", naira, opts);
      form.setValue("variants.0.price", naira, opts);
    }

    if (p.specifications?.length)
      form.setValue(
        "specifications",
        p.specifications.map((s, i) => ({
          name: s.name,
          value: s.value,
          sortOrder: i,
        })),
        opts,
      );
  };

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const products = await parseProductsViaAi({
        rawText,
        categories,
        brands,
        queryClient,
      });
      const product = products[0];
      if (!product) {
        toast.error("No product found in the text");
        return;
      }
      applyProduct(product);
      setRawText("");
      const extra = products.length - 1;
      toast.success(
        extra > 0
          ? `Filled the form from the first listing (${extra} more ignored — use Bulk import for multiple)`
          : "Form filled — review and save",
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not reach the AI service"));
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Card className="border-dashed border-primary/30 bg-primary/[0.03]">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary-ink">
            <AppIcon icon="solar:magic-stick-3-bold" className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              AI Fill from listing
            </h3>
            <p className="text-xs text-muted-foreground">
              Paste one supplier listing — AI fills the fields below for you to
              review. Only fields it finds are filled.
            </p>
          </div>
        </div>

        <Textarea
          placeholder={
            'Paste a single product listing, e.g.\nHP 15-fd0127dx i7 16GB 512GB SSD 15.6" Touch (8X9R2UA) #970,000'
          }
          className="min-h-[110px] resize-none font-mono text-xs"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={isParsing}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleParse}
            disabled={!rawText.trim() || isParsing}
            className="h-10 rounded-lg font-semibold"
          >
            <AppIcon
              icon={
                isParsing ? "solar:refresh-linear" : "solar:magic-stick-3-bold"
              }
              className={isParsing ? "mr-2 size-4 animate-spin" : "mr-2 size-4"}
            />
            {isParsing ? "Parsing…" : "Fill with AI"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
