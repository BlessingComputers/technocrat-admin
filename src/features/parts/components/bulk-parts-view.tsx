"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { getErrorMessage } from "@/lib/api/error-message";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AppIcon } from "@/components/shared/app-icon";

import {
  usePartCategories,
  usePartBrands,
  usePartTypes,
  useBulkCreateParts,
  useBulkUploadPartImages,
  usePartBulkBatchStatus,
} from "../api/parts.queries";
import type { UploadedImageMeta } from "../types/parts";
import { chunkBySize } from "../utils/image-chunks";
import {
  partsBulkDraftStore,
  type LoadedPartsDraft,
} from "../utils/bulk-draft-store";
import { AiPastePanel } from "./bulk/ai-paste-panel";
import { BulkPartCard } from "./bulk/bulk-part-card";
import { BulkPartResultModal } from "./bulk/bulk-part-result-modal";
import { PartRestoreModal } from "./bulk/part-restore-modal";
import {
  applySellMarkup,
  buildBulkPartsPayload,
  findDuplicatePartNumbers,
  formatNaira,
  newBulkPartRow,
  revokeLocalImagePreviews,
  validateBulkPartRow,
  type BulkPartRow,
} from "./bulk/bulk-part-helpers";
import { parseNairaNullable } from "../schemas/part-form";
import { Card } from "@/components/ui/card";

const DEFAULT_MARKUP_PCT = 0;

/** Merge Step-1 CDN metadata into rows by image key. */
function mergeUploaded(
  base: BulkPartRow[],
  uploadedByKey: Record<string, UploadedImageMeta>,
): BulkPartRow[] {
  return base.map((r) => ({
    ...r,
    images: r.images.map((img) =>
      !img.uploaded && uploadedByKey[img.key]
        ? {
            ...img,
            uploaded: uploadedByKey[img.key],
            preview: uploadedByKey[img.key].url,
          }
        : img,
    ),
  }));
}

/** Parts bulk upload + AI smart paste (route `/catalogues/parts/bulk`). */
export function BulkPartsView() {
  const { data: categories = [] } = usePartCategories();
  const { data: brands = [] } = usePartBrands();
  const { data: partTypes = [] } = usePartTypes();
  const bulkCreate = useBulkCreateParts();
  const imageUpload = useBulkUploadPartImages();

  const [rows, setRows] = useState<BulkPartRow[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [resultDismissed, setResultDismissed] = useState(false);
  const [markupPct, setMarkupPct] = useState(DEFAULT_MARKUP_PCT);
  const [imageProgress, setImageProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const { data: batch } = usePartBulkBatchStatus(batchId);

  // ── Draft persistence ──────────────────────────────────────────────
  const [draft, setDraft] = useState<{
    pending: LoadedPartsDraft | null;
    ready: boolean;
  }>({ pending: null, ready: false });

  useEffect(() => {
    const loaded = partsBulkDraftStore.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft({ pending: loaded, ready: loaded === null });
  }, []);

  useEffect(() => {
    if (!draft.ready) return;
    const t = setTimeout(() => {
      if (rows.length > 0) partsBulkDraftStore.save(rows);
      else partsBulkDraftStore.clear();
    }, 400);
    return () => clearTimeout(t);
  }, [rows, draft.ready]);

  const rowsRef = useRef<BulkPartRow[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);
  useEffect(() => () => revokeLocalImagePreviews(rowsRef.current), []);

  // Prune succeeded rows when the batch completes (positional + name check).
  const submittedRef = useRef<{ id: string; name: string }[]>([]);
  useEffect(() => {
    if (batch?.status !== "completed" || !batch.results) return;
    const submitted = submittedRef.current;
    const succeededIds = new Set(
      batch.results
        .filter((r) => r.success)
        .map((r) => {
          const s = submitted[r.row - 1];
          return s && s.name === r.partName?.trim() ? s.id : undefined;
        })
        .filter((id): id is string => id !== undefined),
    );
    if (succeededIds.size === 0) return;
    revokeLocalImagePreviews(
      rowsRef.current.filter((r) => succeededIds.has(r.id)),
    );
    setRows((prev) => prev.filter((r) => !succeededIds.has(r.id)));
  }, [batch]);

  const duplicatePartNumbers = findDuplicatePartNumbers(rows);
  const validCount = rows.filter(
    (r) => validateBulkPartRow(r, duplicatePartNumbers).length === 0,
  ).length;
  const batchTerminal =
    batch?.status === "completed" || batch?.status === "failed";
  const processing = batchId !== null && !batchTerminal;
  const importBusy = imageUpload.isPending || bulkCreate.isPending || processing;

  const addRows = (newRows: BulkPartRow[]) =>
    setRows((prev) => [...prev, ...newRows]);
  const updateRow = (id: string, patch: Partial<BulkPartRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => {
    const removed = rows.find((r) => r.id === id);
    if (removed) revokeLocalImagePreviews([removed]);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleMarkupChange = (pct: number) => {
    setMarkupPct(pct);
    setRows((prev) =>
      prev.map((r) => {
        const cost = parseNairaNullable(r.costPrice);
        return cost != null
          ? { ...r, price: formatNaira(applySellMarkup(cost, pct)) }
          : r;
      }),
    );
  };

  const continueDraft = () => {
    if (draft.pending) setRows(draft.pending.rows);
    setDraft({ pending: null, ready: true });
  };
  const discardDraft = () => {
    partsBulkDraftStore.clear();
    setDraft({ pending: null, ready: true });
  };

  const submitBatch = async (rowsToSubmit: BulkPartRow[]) => {
    const payload = buildBulkPartsPayload(rowsToSubmit);
    const promise = bulkCreate.mutateAsync(payload);
    toast.promise(promise, {
      loading: `Queuing ${rowsToSubmit.length} part(s)…`,
      success: "Batch queued",
      error: (err) => getErrorMessage(err, "Failed to queue batch"),
    });
    try {
      const result = await promise;
      setResultDismissed(false);
      setBatchId(result.batchId);
    } catch {
      /* toast surfaced */
    }
  };

  const runImageUploadAndSubmit = async (rowsToImport: BulkPartRow[]) => {
    let workingRows = rowsToImport;
    const pending = workingRows.flatMap((r) =>
      r.images
        .filter((img) => img.file && !img.uploaded)
        .map((img) => ({ file: img.file!, key: img.key })),
    );
    if (pending.length > 0) {
      const toastId = toast.loading(`Uploading ${pending.length} image(s)…`);
      let uploaded = 0;
      setImageProgress({ completed: 0, total: pending.length });
      const chunks = chunkBySize(pending, (p) => p.file.size, undefined, 1);
      for (const chunk of chunks) {
        try {
          const res = await imageUpload.mutateAsync(chunk);
          uploaded += Object.keys(res).length;
          workingRows = mergeUploaded(workingRows, res);
          const byId = new Map(workingRows.map((r) => [r.id, r]));
          setRows((prev) => prev.map((r) => byId.get(r.id) ?? r));
          setImageProgress({ completed: uploaded, total: pending.length });
          toast.loading(`Uploading images… ${uploaded} / ${pending.length}`, {
            id: toastId,
          });
        } catch (err) {
          // Surface the real reason (rate limit, network, 5xx) instead of a
          // generic line, then fall through to create the parts without the
          // still-pending images.
          toast.error(
            `${getErrorMessage(err, "Some images failed to upload")} — creating parts without them`,
            { id: toastId },
          );
          setImageProgress(null);
          break;
        }
      }
      toast.dismiss(toastId);
      setImageProgress(null);
    }
    await submitBatch(workingRows);
  };

  const handleImport = async () => {
    const workingRows = rows.filter(
      (r) => validateBulkPartRow(r, duplicatePartNumbers).length === 0,
    );
    if (workingRows.length === 0) {
      toast.error("No valid rows to upload");
      return;
    }
    submittedRef.current = workingRows.map((r) => ({
      id: r.id,
      name: r.name.trim(),
    }));
    await runImageUploadAndSubmit(workingRows);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/catalogues/parts"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary-ink"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Parts
      </Link>

      <PageHeader
        title="Bulk Upload Parts"
        description="Paste a supplier list for AI to structure, review the rows, then upload — also the quickest way to add a single part."
      />

      <PartRestoreModal
        open={!!draft.pending}
        partCount={draft.pending?.rows.length ?? 0}
        savedAt={draft.pending?.savedAt ?? 0}
        onContinue={continueDraft}
        onDiscard={discardDraft}
      />

      <AiPastePanel
        categories={categories}
        brands={brands}
        partTypes={partTypes}
        markupPct={markupPct}
        onParsed={addRows}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} row{rows.length === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold text-foreground">{validCount} ready</span>
          {rows.length - validCount > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-warning-ink">
                {rows.length - validCount} need
                {rows.length - validCount === 1 ? "s" : ""} attention
              </span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <label
            htmlFor="parts-markup"
            className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-muted-foreground"
            title="Selling price = cost price + this percentage"
          >
            Markup %
            <Input
              id="parts-markup"
              type="number"
              min={0}
              step={1}
              value={markupPct}
              onChange={(e) =>
                handleMarkupChange(Math.max(0, e.target.valueAsNumber || 0))
              }
              className="h-10 w-20 text-sm font-semibold"
            />
          </label>
          <Button
            variant="outline"
            className="h-10 rounded-lg font-medium"
            onClick={() => addRows([newBulkPartRow()])}
          >
            <AppIcon icon="solar:add-circle-linear" className="mr-2 size-4" />
            Add Row
          </Button>
          <Button
            className="h-10 rounded-lg font-semibold"
            onClick={handleImport}
            disabled={validCount === 0 || importBusy}
          >
            <AppIcon
              icon={importBusy ? "solar:refresh-linear" : "solar:cloud-upload-linear"}
              className={importBusy ? "mr-2 size-4 animate-spin" : "mr-2 size-4"}
            />
            {importBusy ? "Uploading…" : `Upload ${validCount || ""} Part${validCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>

      {(imageProgress || processing) && (
        <div className="space-y-1.5 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-foreground">
              {imageProgress
                ? `Uploading images ${imageProgress.completed}/${imageProgress.total}`
                : `Processing batch… ${batch?.processedParts ?? 0}/${batch?.totalParts ?? 0}`}
            </span>
            {imageProgress && (
              <span className="tabular-nums text-muted-foreground">
                {Math.round((imageProgress.completed / imageProgress.total) * 100)}%
              </span>
            )}
          </div>
          <Progress
            value={
              imageProgress
                ? (imageProgress.completed / imageProgress.total) * 100
                : batch && batch.totalParts
                  ? (batch.processedParts / batch.totalParts) * 100
                  : 10
            }
            className="h-1.5"
          />
        </div>
      )}

      {rows.length === 0 ? (
        <Card className="gap-0 border-dashed py-16 text-center">
          <AppIcon
            icon="solar:cpu-bolt-linear"
            className="mx-auto mb-3 size-12 text-muted-foreground/30"
          />
          <h3 className="font-semibold text-foreground">No parts yet</h3>
          <p className="text-sm text-muted-foreground">
            Paste a list above, or add a row to enter one manually.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <BulkPartCard
              key={row.id}
              row={row}
              categories={categories}
              brands={brands}
              partTypes={partTypes}
              duplicatePartNumbers={duplicatePartNumbers}
              onChange={updateRow}
              onRemove={removeRow}
            />
          ))}
        </div>
      )}

      <BulkPartResultModal
        open={batchTerminal && !resultDismissed}
        batch={batch}
        onUploadMore={() => {
          setResultDismissed(true);
          setBatchId(null);
        }}
        onClose={() => setResultDismissed(true)}
      />
    </div>
  );
}
