"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  BULK_PRICE_CONCURRENCY,
  adjustPrice,
  pendingPriceChanges,
  runLimited,
  type PriceAdjustment,
} from "@/lib/utils/bulk-price";
import { formatPrice } from "@/lib/utils/format";

/**
 * One editable price on the bulk price page: a product variant or a part.
 * `current` is the BASE price — the value PATCH `price` sets; the backend then
 * applies the markup rule. `shelfPrice` (markup applied) is shown read-only
 * when it differs.
 */
export interface BulkPriceRow {
  key: string;
  title: string;
  subtitle?: string;
  current: number | null;
  shelfPrice?: number | null;
  costPrice?: number | null;
  fxLinked?: boolean;
}

type RowStatus = { state: "saving" } | { state: "saved" } | { state: "failed"; error: string };

interface BulkPriceEditorProps {
  noun: string;
  backHref: string;
  rows: BulkPriceRow[];
  isLoading: boolean;
  /** Items that did not load (shown as a warning; the rest stay editable). */
  failedToLoad?: number;
  onSave: (key: string, price: number) => Promise<unknown>;
  /** Called once after a save run with at least one success (refresh lists). */
  onSaved: () => void;
}

const naira = (digits: string) => (digits ? formatPrice(Number(digits)) : "");

export function BulkPriceEditor({
  noun,
  backHref,
  rows,
  isLoading,
  failedToLoad = 0,
  onSave,
  onSaved,
}: BulkPriceEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Record<string, RowStatus>>({});
  const [saving, setSaving] = useState(false);
  const [adj, setAdj] = useState<{ mode: PriceAdjustment["mode"]; value: string; roundTo: string }>(
    { mode: "percent", value: "", roundTo: "1000" },
  );

  // After a save, the saved price is the row's new current price.
  const effectiveRows = useMemo(
    () => rows.map((r) => ({ ...r, current: saved[r.key] ?? r.current })),
    [rows, saved],
  );
  const { changes, invalid } = pendingPriceChanges(effectiveRows, drafts);
  const invalidSet = new Set(invalid);

  const setDraft = (key: string, text: string) =>
    setDrafts((d) => ({ ...d, [key]: naira(text.replace(/\D/g, "")) }));

  const fillAll = () => {
    const value = Number(adj.value);
    if (!adj.value || Number.isNaN(value)) return;
    const next: Record<string, string> = {};
    for (const r of effectiveRows) {
      if (r.current == null) continue;
      const price = adjustPrice(r.current, { mode: adj.mode, value, roundTo: Number(adj.roundTo) });
      next[r.key] = naira(String(price));
    }
    setDrafts(next);
  };

  const save = async () => {
    if (changes.length === 0 || invalid.length > 0) return;
    setSaving(true);
    setStatus((s) => {
      const n = { ...s };
      for (const c of changes) n[c.key] = { state: "saving" };
      return n;
    });
    const results = await runLimited(changes, BULK_PRICE_CONCURRENCY, async (c) => {
      try {
        await onSave(c.key, c.price);
        setSaved((s) => ({ ...s, [c.key]: c.price }));
        setDrafts((d) => {
          const rest = { ...d };
          delete rest[c.key];
          return rest;
        });
        setStatus((s) => ({ ...s, [c.key]: { state: "saved" } }));
      } catch (err) {
        setStatus((s) => ({
          ...s,
          [c.key]: { state: "failed", error: getErrorMessage(err, "Save failed") },
        }));
        throw err;
      }
    });
    setSaving(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) onSaved();
    if (failed === 0) toast.success(`Saved ${ok} price${ok === 1 ? "" : "s"}`);
    else toast.error(`${failed} of ${results.length} failed. Fix or retry them, then save again.`);
  };

  const count = changes.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Update prices"
        description={`Set a new base price for each ${noun}. The markup rule is added on save.`}
      >
        <Button asChild variant="outline" className="h-10 rounded-md">
          <Link href={backHref}>
            <AppIcon icon="solar:arrow-left-linear" className="mr-1.5 size-4" />
            Back
          </Link>
        </Button>
        <Button
          onClick={save}
          disabled={saving || count === 0 || invalid.length > 0}
          className="h-10 rounded-md"
        >
          <AppIcon icon="solar:check-circle-linear" className="mr-1.5 size-4" />
          {saving ? "Saving…" : `Save ${count} change${count === 1 ? "" : "s"}`}
        </Button>
      </PageHeader>

      <Card className="flex flex-row flex-wrap items-end gap-3 p-4">
        <div className="space-y-1.5">
          <label htmlFor="bulk-price-mode" className="text-xs font-medium text-muted-foreground">
            Change all by
          </label>
          <Select
            value={adj.mode}
            onValueChange={(mode) => setAdj((a) => ({ ...a, mode: mode as PriceAdjustment["mode"] }))}
          >
            <SelectTrigger id="bulk-price-mode" className="h-10 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent (%)</SelectItem>
              <SelectItem value="amount">Amount (₦)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bulk-price-value" className="text-xs font-medium text-muted-foreground">
            Value (negative lowers)
          </label>
          <Input
            id="bulk-price-value"
            type="number"
            inputMode="decimal"
            placeholder={adj.mode === "percent" ? "5" : "2000"}
            value={adj.value}
            onChange={(e) => setAdj((a) => ({ ...a, value: e.target.value }))}
            className="h-10 w-36"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bulk-price-round" className="text-xs font-medium text-muted-foreground">
            Round to
          </label>
          <Select value={adj.roundTo} onValueChange={(roundTo) => setAdj((a) => ({ ...a, roundTo }))}>
            <SelectTrigger id="bulk-price-round" className="h-10 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">No rounding</SelectItem>
              <SelectItem value="100">Nearest ₦100</SelectItem>
              <SelectItem value="1000">Nearest ₦1,000</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={fillAll} disabled={!adj.value || saving} className="h-10 rounded-md">
          Fill all
        </Button>
        <Button
          variant="ghost"
          onClick={() => setDrafts({})}
          disabled={saving || Object.keys(drafts).length === 0}
          className="h-10 rounded-md"
        >
          Reset
        </Button>
        <p className="basis-full text-xs text-muted-foreground">
          Fill all only fills the inputs. Check or edit each row, then save.
        </p>
      </Card>

      {failedToLoad > 0 ? (
        <p className="flex items-center gap-2 text-sm text-warning-ink">
          <AppIcon icon="solar:danger-triangle-linear" className="size-4" />
          {failedToLoad} {noun}
          {failedToLoad === 1 ? "" : "s"} did not load and are not shown.
        </p>
      ) : null}

      <Card className="gap-0 overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{noun[0].toUpperCase() + noun.slice(1)}</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Current base</TableHead>
              <TableHead className="w-48">New base price</TableHead>
              <TableHead className="w-40">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Loading prices…
                </TableCell>
              </TableRow>
            ) : effectiveRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nothing to edit. Go back and select some {noun}s.
                </TableCell>
              </TableRow>
            ) : (
              effectiveRows.map((r) => {
                const draft = drafts[r.key];
                const draftNum = Number((draft ?? "").replace(/\D/g, "")) || null;
                const belowCost =
                  draftNum != null && r.costPrice != null && r.costPrice > 0 && draftNum < r.costPrice;
                const st = status[r.key];
                return (
                  <TableRow key={r.key}>
                    <TableCell className="max-w-md">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{r.title}</span>
                        {r.fxLinked ? (
                          <Badge variant="info" title="Price follows the dollar rate. A manual price resets its dollar value.">
                            FX
                          </Badge>
                        ) : null}
                      </div>
                      {r.subtitle ? (
                        <div className="text-xs text-muted-foreground">{r.subtitle}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.costPrice ? formatPrice(r.costPrice) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.current != null ? formatPrice(r.current) : "On request"}
                      {r.shelfPrice != null && r.current != null && r.shelfPrice !== r.current ? (
                        <div className="text-xs text-muted-foreground">
                          Shelf {formatPrice(r.shelfPrice)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`New base price for ${r.title}${r.subtitle ? `, ${r.subtitle}` : ""}`}
                        inputMode="numeric"
                        placeholder={r.current != null ? formatPrice(r.current) : "No change"}
                        value={draft ?? ""}
                        onChange={(e) => setDraft(r.key, e.target.value)}
                        disabled={saving}
                        aria-invalid={invalidSet.has(r.key) || undefined}
                        className="h-9 tabular-nums"
                      />
                      {invalidSet.has(r.key) ? (
                        <p className="mt-1 text-xs text-destructive-ink">Must be above ₦0</p>
                      ) : belowCost ? (
                        <p className="mt-1 text-xs text-warning-ink">Below cost</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {st?.state === "saving" ? (
                        <span className="text-muted-foreground">Saving…</span>
                      ) : st?.state === "saved" ? (
                        <span className="flex items-center gap-1 text-success-ink">
                          <AppIcon icon="solar:check-circle-linear" className="size-4" />
                          Saved
                        </span>
                      ) : st?.state === "failed" ? (
                        <span className="flex items-start gap-1 text-destructive-ink" title={st.error}>
                          <AppIcon icon="solar:close-circle-linear" className="mt-0.5 size-4 shrink-0" />
                          <span className="line-clamp-2">Failed: {st.error}</span>
                        </span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
