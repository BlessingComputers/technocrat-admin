"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNaira, parseNaira } from "../../schemas/product-form";
import { applySellMarkup, type BulkVariant } from "./bulk-helpers";
import { Card } from "@/components/ui/card";

const CONDITIONS: BulkVariant["condition"][] = [
  "NEW",
  "REFURBISHED",
  "USED",
  "OPEN_BOX",
];
const SOURCING: BulkVariant["sourcingType"][] = ["INHOUSE", "OUTSOURCED"];

const FIELD = "h-8 text-xs";
const LABEL = "text-xs font-medium text-muted-foreground";

interface BulkVariantRowProps {
  variant: BulkVariant;
  /** Top-level markup % — editing Cost recomputes Price from it. */
  markupPct: number;
  onChange: (patch: Partial<BulkVariant>) => void;
}

export function BulkVariantRow({
  variant,
  markupPct,
  onChange,
}: BulkVariantRowProps) {
  const handleCostChange = (raw: string) => {
    const costPrice = formatNaira(raw);
    const cost = parseNaira(costPrice);
    onChange({
      costPrice,
      // Selling price follows cost + markup; clears when cost clears.
      price: cost > 0 ? formatNaira(applySellMarkup(cost, markupPct)) : "",
    });
  };

  return (
    <Card className="gap-0 p-3 space-y-2">
      <div className="flex items-center justify-end gap-2">
        <span className={LABEL}>Active</span>
        <Switch
          checked={variant.isActive}
          onCheckedChange={(v) => onChange({ isActive: v })}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <label className="space-y-1">
          <span className={LABEL}>Part Number*</span>
          <Input
            value={variant.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            placeholder="e.g. PC14250"
            className={FIELD}
          />
        </label>
        <label className="space-y-1">
          <span className={LABEL}>Price*</span>
          <Input
            value={variant.price}
            onChange={(e) => onChange({ price: formatNaira(e.target.value) })}
            placeholder="₦0"
            className={`${FIELD} font-semibold`}
          />
        </label>
        <label className="space-y-1">
          <span className={LABEL}>Cost</span>
          <Input
            value={variant.costPrice}
            onChange={(e) => handleCostChange(e.target.value)}
            placeholder="₦0"
            className={FIELD}
          />
        </label>
        <label className="space-y-1">
          <span className={LABEL}>Compare-at</span>
          <Input
            value={variant.compareAtPrice}
            onChange={(e) =>
              onChange({ compareAtPrice: formatNaira(e.target.value) })
            }
            placeholder="—"
            className={FIELD}
          />
        </label>
        <label className="space-y-1">
          <span className={LABEL}>Condition</span>
          <Select
            value={variant.condition}
            onValueChange={(v) =>
              onChange({ condition: v as BulkVariant["condition"] })
            }
          >
            <SelectTrigger className={`${FIELD} w-full`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1">
          <span className={LABEL}>Sourcing</span>
          <Select
            value={variant.sourcingType}
            onValueChange={(v) =>
              onChange({ sourcingType: v as BulkVariant["sourcingType"] })
            }
          >
            <SelectTrigger className={`${FIELD} w-full`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCING.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1">
          <span className={LABEL}>Weight (kg)</span>
          <Input
            value={variant.weight}
            onChange={(e) => onChange({ weight: e.target.value })}
            placeholder="—"
            type="number"
            min="0"
            className={FIELD}
          />
        </label>
        <label className="space-y-1">
          <span className={LABEL}>Stock</span>
          <Input
            type="number"
            min="0"
            value={variant.stockQuantity}
            onChange={(e) =>
              onChange({ stockQuantity: e.target.valueAsNumber || 0 })
            }
            className={FIELD}
          />
        </label>
        <label className="space-y-1">
          <span className={LABEL}>Low-stock</span>
          <Input
            type="number"
            min="0"
            value={variant.lowStockThreshold}
            onChange={(e) =>
              onChange({ lowStockThreshold: e.target.valueAsNumber || 0 })
            }
            className={FIELD}
          />
        </label>
        <label className="space-y-1 col-span-2">
          <span className={LABEL}>Image URL</span>
          <Input
            value={variant.imageUrl}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="https://…"
            className={FIELD}
          />
        </label>
      </div>
    </Card>
  );
}
