"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";
import type { ProductBrand, ProductCategory } from "../../types/products";
import { parseProductsViaAi } from "../../api/ai-parse.client";
import { aiProductToRow, type BulkRow } from "./bulk-helpers";

interface AiPastePanelProps {
  categories: ProductCategory[];
  brands: ProductBrand[];
  /** Top-level markup % — parsed supplier prices become Cost, Price = Cost + markup. */
  markupPct: number;
  onParsed: (rows: BulkRow[]) => void;
}

export function AiPastePanel({
  categories,
  brands,
  markupPct,
  onParsed,
}: AiPastePanelProps) {
  const queryClient = useQueryClient();
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

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
      const rows = products.map((p) => aiProductToRow(p, markupPct));
      if (rows.length === 0) {
        toast.error("No products found in the text");
        return;
      }
      onParsed(rows);
      setRawText("");
      toast.success(`Parsed ${rows.length} product(s)`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not reach the AI service"));
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Card className="border border-border">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <AppIcon icon="solar:magic-stick-3-bold" className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Smart Paste</h3>
            <p className="text-xs text-muted-foreground">
              Paste a raw supplier list — AI structures it into rows below
            </p>
          </div>
        </div>

        <Textarea
          placeholder={
            "Paste product listings here, e.g.\nHP 15-fd0127dx i7 16GB 512GB SSD 15.6\" Touch (8X9R2UA) #970,000 (4unit)"
          }
          className="min-h-[140px] resize-none font-mono text-xs"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={isParsing}
        />

        <div className="flex justify-end">
          <Button
            onClick={handleParse}
            disabled={!rawText.trim() || isParsing}
            className="rounded-lg font-semibold h-10"
          >
            <AppIcon
              icon={isParsing ? "solar:refresh-linear" : "solar:magic-stick-3-bold"}
              className={isParsing ? "size-4 mr-2 animate-spin" : "size-4 mr-2"}
            />
            {isParsing ? "Parsing…" : "Parse with AI"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
