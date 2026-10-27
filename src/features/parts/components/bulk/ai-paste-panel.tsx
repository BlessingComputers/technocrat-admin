"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";
import { parsePartsViaAi, type AiParsedPart } from "../../api/ai-parse.client";
import type { Brand, Category, PartType } from "../../types/parts";
import { Card } from "@/components/ui/card";
import {
  applySellMarkup,
  formatNaira,
  newBulkPartRow,
  type BulkPartRow,
} from "./bulk-part-helpers";

interface AiPastePanelProps {
  categories: Category[];
  brands: Brand[];
  partTypes: PartType[];
  markupPct: number;
  onParsed: (rows: BulkPartRow[]) => void;
}

function parsedToRow(p: AiParsedPart, markupPct: number): BulkPartRow {
  const cost = p.costPrice ?? p.price ?? null;
  const sell = cost != null ? applySellMarkup(cost, markupPct) : null;
  return newBulkPartRow({
    name: p.name ?? "",
    partNumber: p.partNumber ?? "",
    partTypeId: p.partTypeId ?? "",
    categoryId: p.categoryId ?? "",
    brandId: p.brandId ?? "",
    ownerSku: p.ownerSku ?? "",
    description: p.description ?? "",
    costPrice: cost != null ? formatNaira(cost) : "",
    price: sell != null ? formatNaira(sell) : "",
    stockQuantity: p.stockQuantity ?? 0,
    specifications: p.specifications ?? [],
  });
}

export function AiPastePanel({
  categories,
  brands,
  partTypes,
  markupPct,
  onParsed,
}: AiPastePanelProps) {
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
      if (parsed.length === 0) {
        toast.error("No parts found in the pasted text");
        return;
      }
      onParsed(parsed.map((p) => parsedToRow(p, markupPct)));
      setText("");
      toast.success(`Parsed ${parsed.length} part(s) — review below`);
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
            Paste a supplier parts list — AI structures it into rows to review
          </p>
        </div>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste raw parts text here…"
        className="h-28 resize-none font-mono text-xs"
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
          {loading ? "Parsing…" : "Parse with AI"}
        </Button>
      </div>
    </Card>
  );
}
