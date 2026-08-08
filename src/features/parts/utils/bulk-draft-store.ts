import type { BulkPartRow } from "../components/bulk/bulk-part-helpers";

/**
 * Persists the in-progress parts bulk-upload draft to localStorage so leaving the
 * page doesn't lose work, and an uploaded image survives a reload. Mirrors the
 * product draft store with its own key. Cleared only when the rows empty out.
 */

const DRAFT_KEY = "bl_parts_bulk_draft";
// Bump when BulkPartRow's shape changes so stale drafts are discarded.
const DRAFT_VERSION = 1;
const TTL_MS = 48 * 60 * 60 * 1000; // 48h

/** File objects / blob URLs don't survive JSON — keep only uploaded images. */
function persistableRow(row: BulkPartRow): BulkPartRow {
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
  rows: BulkPartRow[];
}

export interface LoadedPartsDraft {
  rows: BulkPartRow[];
  savedAt: number;
}

export const partsBulkDraftStore = {
  save(rows: BulkPartRow[]): void {
    if (typeof window === "undefined") return;
    try {
      const blob: DraftBlob = {
        version: DRAFT_VERSION,
        savedAt: Date.now(),
        rows: rows.map(persistableRow),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(blob));
    } catch (err) {
      console.error("Failed to save parts bulk draft:", err);
    }
  },

  load(): LoadedPartsDraft | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const blob = JSON.parse(raw) as DraftBlob;
      if (blob.version !== DRAFT_VERSION) {
        partsBulkDraftStore.clear();
        return null;
      }
      if (Date.now() - blob.savedAt > TTL_MS) {
        partsBulkDraftStore.clear();
        return null;
      }
      if (!Array.isArray(blob.rows) || blob.rows.length === 0) return null;
      return { rows: blob.rows, savedAt: blob.savedAt };
    } catch {
      partsBulkDraftStore.clear();
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
