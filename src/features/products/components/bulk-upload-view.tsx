"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/shared/app-icon";

import {
  useCategories,
  useBrands,
  useBulkCreateProducts,
  useBulkBatchStatus,
  useBulkUploadImages,
} from "../api/products.queries";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/error-message";
import type { UploadedImageMeta } from "../types/products";
import { bulkDraftStore, type LoadedDraft } from "../utils/bulk-draft-store";
import { AiPastePanel } from "./bulk/ai-paste-panel";
import { BulkProductCard } from "./bulk/bulk-product-card";
import { BulkProgress } from "./bulk/bulk-progress";
import { BulkRestoreModal } from "./bulk/bulk-restore-modal";
import { BulkResultModal } from "./bulk/bulk-result-modal";
import { BulkRateLimitModal } from "./bulk/bulk-rate-limit-modal";
import { BulkImageFailModal } from "./bulk/bulk-image-fail-modal";
import {
  applySellMarkup,
  buildBulkPayload,
  findDuplicateSkus,
  newBulkRow,
  revokeLocalImagePreviews,
  validateBulkRow,
  type BulkRow,
} from "./bulk/bulk-helpers";
import { formatNaira, parseNaira } from "../schemas/product-form";
import { chunkBySize } from "../utils/image-chunks";
import { Card } from "@/components/ui/card";

// Default markup is 0 — uploads land with selling price EQUAL to cost; profit is
// activated later via the markup engine. Staff can still raise it per-batch.
const DEFAULT_MARKUP_PCT = 0;

/** Snapshot taken when the hourly image-upload rate limit (429) halts Step 1. */
interface RateLimitHalt {
  retryAfterSec: number | null;
  uploadedCount: number;
  remainingCount: number;
  /** Rows with every successfully-uploaded image's metadata merged in. */
  rows: BulkRow[];
}

/** Snapshot taken when a non-rate-limit image-upload failure halts Step 1. */
interface ImageFailHalt {
  uploadedCount: number;
  failedCount: number;
  /** Specific reason (server message / network) shown in the halt modal. */
  reason: string;
  /** Rows with every successfully-uploaded image's metadata merged in. */
  rows: BulkRow[];
}

/** Merge Step-1 CDN metadata into rows (immutably) by image key. */
function mergeUploaded(
  base: BulkRow[],
  uploadedByKey: Record<string, UploadedImageMeta>,
): BulkRow[] {
  return base.map((r) => ({
    ...r,
    images: r.images.map((img) =>
      !img.uploaded && uploadedByKey[img.key]
        ? { ...img, uploaded: uploadedByKey[img.key] }
        : img,
    ),
  }));
}

/** Bulk upload + AI smart paste (route `/catalogues/bulk`). */
export function BulkUploadView() {
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const bulkCreate = useBulkCreateProducts();
  const imageUpload = useBulkUploadImages();

  const [rows, setRows] = useState<BulkRow[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  // Outcome modal dismissal — derived open state, reset on each new import.
  const [resultDismissed, setResultDismissed] = useState(false);
  // Set when the image-upload rate limit halts an import mid-flight.
  const [rateLimitHalt, setRateLimitHalt] = useState<RateLimitHalt | null>(null);
  // Set when a non-rate-limit image-upload failure halts an import mid-flight.
  const [imageFailHalt, setImageFailHalt] = useState<ImageFailHalt | null>(null);
  // Row ids whose images failed to upload — marked with a badge so it's obvious
  // which created products still need images added.
  const [missingImageRowIds, setMissingImageRowIds] = useState<Set<string>>(
    () => new Set(),
  );
  // Per-image upload progress (Step 1). Drives the counted bar in BulkProgress;
  // null when no image upload is in flight.
  const [imageUploadProgress, setImageUploadProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  // Selling price = cost + this % (parsed supplier prices land in Cost).
  const [markupPct, setMarkupPct] = useState(DEFAULT_MARKUP_PCT);
  const { data: batch, isLoading: batchLoading } = useBulkBatchStatus(batchId);

  // ── Draft persistence ──────────────────────────────────────────────
  // `ready` gates autosave so the restore prompt can't be clobbered before the
  // user decides. A pending draft (if any) is held until they Continue/Discard.
  const [draftState, setDraftState] = useState<{
    pending: LoadedDraft | null;
    ready: boolean;
  }>({ pending: null, ready: false });
  const { pending: pendingDraft, ready } = draftState;

  useEffect(() => {
    const draft = bulkDraftStore.load();
    // One-shot hydration of the restore prompt from localStorage on mount —
    // genuinely reading an external store, runs once (empty deps).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftState({ pending: draft, ready: draft === null });
  }, []);

  // Debounced autosave (once the restore decision is made).
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (rows.length > 0) bulkDraftStore.save(rows);
      else bulkDraftStore.clear();
    }, 400);
    return () => clearTimeout(t);
  }, [rows, ready]);

  const continueDraft = () => {
    if (pendingDraft) setRows(pendingDraft.rows);
    setDraftState({ pending: null, ready: true });
  };
  const discardDraft = () => {
    bulkDraftStore.clear();
    setDraftState({ pending: null, ready: true });
  };

  // ── Per-row clearing: prune rows whose product was created (keep failures) ──
  const submittedRef = useRef<{ id: string; name: string }[]>([]);

  // Mirror of `rows` for effects/cleanups that must read the latest value
  // without re-subscribing (pruning revocation, unmount revocation).
  const rowsRef = useRef<BulkRow[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Release blob: previews still alive when leaving the page.
  useEffect(() => {
    return () => revokeLocalImagePreviews(rowsRef.current);
  }, []);

  useEffect(() => {
    if (batch?.status !== "completed" || !batch.results) return;
    // Identity is positional: results[].row is 1-based over the submitted
    // products (payload order === submittedRef order). The echoed name is only
    // a sanity check — if the numbering ever differs from what we assume, the
    // mismatch fails safe (no prune) instead of pruning the wrong card. Names
    // alone can't be the key: two rows may share one, and pruning by name
    // would delete a failed twin alongside its succeeded namesake.
    const submitted = submittedRef.current;
    const succeededIds = new Set(
      batch.results
        .filter((res) => res.success)
        .map((res) => {
          const s = submitted[res.row - 1];
          return s && s.name === res.productName?.trim() ? s.id : undefined;
        })
        .filter((id): id is string => id !== undefined),
    );
    if (succeededIds.size === 0) return;
    revokeLocalImagePreviews(rowsRef.current.filter((r) => succeededIds.has(r.id)));
    setRows((prev) => prev.filter((r) => !succeededIds.has(r.id)));
  }, [batch]);

  // Part numbers double as SKUs — flag collisions across the batch.
  const duplicateSkus = findDuplicateSkus(rows);
  const validCount = rows.filter(
    (r) => validateBulkRow(r, duplicateSkus).length === 0,
  ).length;
  const batchTerminal =
    batch?.status === "completed" || batch?.status === "failed";
  const processing = batchId !== null && !batchTerminal;
  const importBusy =
    imageUpload.isPending || bulkCreate.isPending || processing;

  const addRows = (newRows: BulkRow[]) => setRows((prev) => [...prev, ...newRows]);
  const updateRow = (id: string, patch: Partial<BulkRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => {
    const removed = rows.find((r) => r.id === id);
    if (removed) revokeLocalImagePreviews([removed]);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Changing the markup recomputes every selling price from its cost price
  // (rows without a cost are left alone).
  const handleMarkupChange = (pct: number) => {
    setMarkupPct(pct);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        variants: r.variants.map((v) => {
          const cost = parseNaira(v.costPrice);
          return cost > 0
            ? { ...v, price: formatNaira(applySellMarkup(cost, pct)) }
            : v;
        }),
      })),
    );
  };

  // Step 2 — queue the bulk create, referencing the uploaded keys. Also the
  // entry point for "import without remaining images" after a rate-limit halt.
  const submitBatch = async (rowsToSubmit: BulkRow[]) => {
    const payload = buildBulkPayload(rowsToSubmit);
    const promise = bulkCreate.mutateAsync(payload);
    toast.promise(promise, {
      loading: `Queuing ${rowsToSubmit.length} product(s)…`,
      success: "Batch queued",
      error: (err) => getErrorMessage(err, "Failed to queue batch"),
    });
    try {
      const result = await promise;
      // Keep the rows on screen — they're pruned per-row when the batch
      // completes, so a partial failure leaves the failed rows to retry.
      setResultDismissed(false);
      setBatchId(result.batchId);
    } catch {
      // toast already surfaced the error
    }
  };

  // Step 1 (+ Step 2) — pre-upload images that don't have CDN metadata yet
  // (POST /products/images/bulk-upload), then queue the bulk create. Metadata
  // is merged into row state after EVERY chunk, so a mid-flight failure keeps
  // the finished uploads; a retry only sends the remainder. Re-runnable: the
  // rate-limit and image-fail modals call this again with the merged rows.
  const runImageUploadAndSubmit = async (rowsToImport: BulkRow[]) => {
    let workingRows = rowsToImport;
    const pending = workingRows.flatMap((r) =>
      r.images
        .filter((img) => img.file && !img.uploaded)
        .map((img) => ({ file: img.file!, key: img.key })),
    );
    if (pending.length > 0) {
      const toastId = toast.loading(`Uploading ${pending.length} image(s)…`);
      let uploadedCount = 0;
      setImageUploadProgress({ completed: 0, total: pending.length });
      // ONE image per request: keeps each upload short so it fits within free
      // Vercel's function limit (batching several blew it → 504) and lets the
      // progress bar advance per image. Still size-capped as a backstop.
      const chunks = chunkBySize(pending, (p) => p.file.size, undefined, 1);
      for (const chunk of chunks) {
        try {
          const res = await imageUpload.mutateAsync(chunk);
          uploadedCount += Object.keys(res).length;
          workingRows = mergeUploaded(workingRows, res);
          const byId = new Map(workingRows.map((r) => [r.id, r]));
          setRows((prev) => prev.map((r) => byId.get(r.id) ?? r));
          setImageUploadProgress({
            completed: uploadedCount,
            total: pending.length,
          });
          toast.loading(
            `Uploading images… ${uploadedCount} / ${pending.length}`,
            { id: toastId },
          );
        } catch (err) {
          toast.dismiss(toastId);
          setImageUploadProgress(null);
          if (err instanceof ApiError && err.status === 429) {
            // Hourly upload limit hit mid-flight. Finished uploads are saved
            // on the rows (and the draft); offer to wait or import without
            // the remaining images.
            const retryAfterSec =
              (err.data as { retryAfter?: number } | null)?.retryAfter ?? null;
            setRateLimitHalt({
              retryAfterSec,
              uploadedCount,
              remainingCount: pending.length - uploadedCount,
              rows: workingRows,
            });
          } else {
            // Any other failure (network, timeout, 5xx): let the user retry the
            // remaining uploads or create the products without the failed images.
            setImageFailHalt({
              uploadedCount,
              failedCount: pending.length - uploadedCount,
              reason: getErrorMessage(err, "An image failed to upload."),
              rows: workingRows,
            });
            // Mark the affected rows so their cards show an "images not
            // uploaded" badge (kept if the user imports without them).
            setMissingImageRowIds(
              new Set(
                workingRows
                  .filter((r) =>
                    r.images.some((img) => img.file && !img.uploaded),
                  )
                  .map((r) => r.id),
              ),
            );
          }
          return;
        }
      }
      toast.success(`${uploadedCount} image(s) uploaded`, { id: toastId });
      setImageUploadProgress(null);
    }

    await submitBatch(workingRows);
  };

  const handleImport = async () => {
    const workingRows = rows.filter(
      (r) => validateBulkRow(r, duplicateSkus).length === 0,
    );
    if (workingRows.length === 0) {
      toast.error("No valid rows to upload");
      return;
    }
    // Remember what we submitted so completed rows can be pruned by name.
    submittedRef.current = workingRows.map((r) => ({ id: r.id, name: r.name.trim() }));
    // Fresh attempt — drop any stale "images not uploaded" markers.
    setMissingImageRowIds(new Set());
    await runImageUploadAndSubmit(workingRows);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link
        href="/catalogues"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary-ink transition-colors"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Products
      </Link>

      <PageHeader
        title="Bulk Upload"
        description="Paste a supplier list for AI to structure, review the rows, then upload"
      />

      <AiPastePanel
        categories={categories}
        brands={brands}
        markupPct={markupPct}
        onParsed={addRows}
      />

      <div className="flex items-center justify-between gap-3">
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
            htmlFor="bulk-markup"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap"
            title="Selling price = cost price + this percentage"
          >
            Markup %
            <Input
              id="bulk-markup"
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
            className="rounded-lg font-medium h-10"
            onClick={() => addRows([newBulkRow()])}
          >
            <AppIcon icon="solar:add-circle-linear" className="size-4 mr-2" />
            Add Product
          </Button>
          <Button
            className="rounded-lg font-semibold h-10"
            onClick={handleImport}
            disabled={validCount === 0 || importBusy}
          >
            <AppIcon
              icon={importBusy ? "solar:refresh-linear" : "solar:cloud-upload-linear"}
              className={importBusy ? "size-4 mr-2 animate-spin" : "size-4 mr-2"}
            />
            {importBusy
              ? "Uploading…"
              : `Upload ${validCount > 0 ? validCount : ""} Product${validCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>

      {/* Live import status — kept above the fold so activity is obvious. */}
      {(imageUploadProgress || imageUpload.isPending || batchId) && (
        <BulkProgress
          batch={batch}
          isLoading={batchLoading}
          uploadingImages={!!imageUploadProgress || imageUpload.isPending}
          imageProgress={imageUploadProgress}
        />
      )}

      {rows.length === 0 ? (
        <Card className="gap-0 py-16 text-center border-dashed">
          <AppIcon
            icon="solar:cloud-upload-linear"
            className="size-12 text-muted-foreground/30 mx-auto mb-3"
          />
          <h3 className="font-semibold text-foreground">No products yet</h3>
          <p className="text-sm text-muted-foreground">
            Paste a list above, or add a product manually to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.div
                key={row.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <BulkProductCard
                  row={row}
                  categories={categories}
                  brands={brands}
                  markupPct={markupPct}
                  duplicateSkus={duplicateSkus}
                  flagMissingImages={missingImageRowIds.has(row.id)}
                  onChange={updateRow}
                  onRemove={removeRow}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <BulkRateLimitModal
        open={rateLimitHalt !== null}
        uploadedCount={rateLimitHalt?.uploadedCount ?? 0}
        remainingCount={rateLimitHalt?.remainingCount ?? 0}
        retryAfterSec={rateLimitHalt?.retryAfterSec ?? null}
        onWait={() => setRateLimitHalt(null)}
        onImportAnyway={() => {
          const halt = rateLimitHalt;
          setRateLimitHalt(null);
          if (halt) void submitBatch(halt.rows);
        }}
      />

      <BulkImageFailModal
        open={imageFailHalt !== null}
        uploadedCount={imageFailHalt?.uploadedCount ?? 0}
        failedCount={imageFailHalt?.failedCount ?? 0}
        reason={imageFailHalt?.reason}
        onContinueWithout={() => {
          const halt = imageFailHalt;
          setImageFailHalt(null);
          if (halt) void submitBatch(halt.rows);
        }}
        onRetry={() => {
          const halt = imageFailHalt;
          setImageFailHalt(null);
          if (halt) void runImageUploadAndSubmit(halt.rows);
        }}
      />

      <BulkResultModal
        open={batchTerminal && !resultDismissed}
        batch={batch}
        onUploadMore={() => {
          setResultDismissed(true);
          setBatchId(null);
        }}
        onClose={() => setResultDismissed(true)}
      />

      <BulkRestoreModal
        open={pendingDraft !== null}
        productCount={pendingDraft?.rows.length ?? 0}
        savedAt={pendingDraft?.savedAt ?? 0}
        onContinue={continueDraft}
        onDiscard={discardDraft}
      />
    </div>
  );
}
