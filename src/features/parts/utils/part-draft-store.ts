import type { PartFormValues } from "../schemas/part-form";

/**
 * Persists an in-progress single-part create form to localStorage so leaving the
 * page (or a reload) doesn't lose work — the uploader resumes from where they
 * stopped. Mirrors the bulk draft stores; keyed per product since the create
 * form is always scoped to a product (`/catalogues/[id]/parts/new`).
 *
 * Queued image files aren't stored (File objects / blob URLs don't survive JSON,
 * and images upload on save) — the text fields are what's worth restoring. The
 * draft is cleared on a successful create or when the user starts over.
 */

const KEY_PREFIX = "bl_part_draft_";
// Bump when PartFormValues' shape changes so stale drafts are discarded.
const DRAFT_VERSION = 1;
const TTL_MS = 48 * 60 * 60 * 1000; // 48h

interface DraftBlob {
  version: number;
  savedAt: number;
  values: PartFormValues;
}

export interface LoadedPartDraft {
  values: PartFormValues;
  savedAt: number;
}

/** `scope` is the product id (create is product-scoped); "standalone" otherwise. */
const keyFor = (scope: string) => `${KEY_PREFIX}${scope}`;

export const partDraftStore = {
  save(scope: string, values: PartFormValues): void {
    if (typeof window === "undefined") return;
    try {
      const blob: DraftBlob = { version: DRAFT_VERSION, savedAt: Date.now(), values };
      localStorage.setItem(keyFor(scope), JSON.stringify(blob));
    } catch (err) {
      console.error("Failed to save part draft:", err);
    }
  },

  /** Returns a current-version, unexpired draft, else null (and prunes a bad one). */
  load(scope: string): LoadedPartDraft | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(keyFor(scope));
      if (!raw) return null;
      const blob = JSON.parse(raw) as DraftBlob;
      if (blob.version !== DRAFT_VERSION) {
        partDraftStore.clear(scope);
        return null;
      }
      if (Date.now() - blob.savedAt > TTL_MS) {
        partDraftStore.clear(scope);
        return null;
      }
      if (!blob.values || typeof blob.values !== "object") return null;
      return { values: blob.values, savedAt: blob.savedAt };
    } catch {
      partDraftStore.clear(scope);
      return null;
    }
  },

  clear(scope: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(keyFor(scope));
    } catch {
      /* ignore */
    }
  },
};
