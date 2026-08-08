import type { BulkRow } from "../components/bulk/bulk-helpers";

/**
 * Persists the in-progress bulk-upload draft (the whole parsed/edited batch) to
 * localStorage so leaving the page and coming back doesn't lose work — and so an
 * uploaded image URL on a row survives a reload (no re-deriving identity from the
 * product name; the row's stable `id` IS the identity).
 *
 * The draft is cleared only when its rows empty out (i.e. every product imported
 * successfully — see per-row pruning in the view), never on queue.
 */

const DRAFT_KEY = "bl_bulk_draft";
// Bump when BulkRow's shape changes so stale drafts are discarded, not mis-hydrated.
const DRAFT_VERSION = 5; // v5: sku (part number) re-added to the single variant
const TTL_MS = 48 * 60 * 60 * 1000; // 48h

/**
 * File objects and blob: object URLs don't survive JSON — persist only images
 * that already have CDN metadata, previewing from the uploaded URL.
 */
function persistableRow(row: BulkRow): BulkRow {
  return {
    ...row,
    images: row.images
      .filter((img) => img.uploaded)
      .map((img) => ({
        id: img.id,
        key: img.key,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
        altText: img.altText,
        preview: img.uploaded!.url,
        uploaded: img.uploaded,
      })),
  };
}

interface DraftBlob {
  version: number;
  savedAt: number;
  rows: BulkRow[];
}

export interface LoadedDraft {
  rows: BulkRow[];
  savedAt: number;
}

export const bulkDraftStore = {
  save(rows: BulkRow[]): void {
    if (typeof window === "undefined") return;
    try {
      const blob: DraftBlob = {
        version: DRAFT_VERSION,
        savedAt: Date.now(),
        rows: rows.map(persistableRow),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(blob));
    } catch (err) {
      console.error("Failed to save bulk draft:", err);
    }
  },

  /** Returns a non-empty, current-version, unexpired draft, else null (and prunes a bad one). */
  load(): LoadedDraft | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const blob = JSON.parse(raw) as DraftBlob;
      if (blob.version !== DRAFT_VERSION) {
        bulkDraftStore.clear();
        return null;
      }
      if (Date.now() - blob.savedAt > TTL_MS) {
        bulkDraftStore.clear();
        return null;
      }
      if (!Array.isArray(blob.rows) || blob.rows.length === 0) return null;
      return { rows: blob.rows, savedAt: blob.savedAt };
    } catch {
      bulkDraftStore.clear();
      return null;
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  },
};
