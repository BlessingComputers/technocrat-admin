import { templateFor, type TemplateKey } from "../constants/placements";
import type { Promotion } from "../types/promotions";

/**
 * Whether moving a promotion from one slot to another makes its existing art
 * the wrong shape.
 *
 * The answer is "only if the TEMPLATE changed". Eight of the eleven slots are
 * `band`, so moving a banner between two of them is the daily case and warning
 * about it would train staff to ignore the warning — which is exactly what the
 * ratio-lives-on-the-template design was for (§2.6.2, §7).
 *
 * Returns `null` when there is nothing to say: no slides yet, no move, or
 * either end unplaced (an unknown key has no template to compare).
 */
export function templateChangeWarning(
  from: string | null | undefined,
  to: string | null | undefined,
  slideCount: number,
): { from: TemplateKey; to: TemplateKey } | null {
  if (slideCount <= 0) return null;
  const fromTemplate = templateFor(from);
  const toTemplate = templateFor(to);
  if (!fromTemplate || !toTemplate) return null;
  if (fromTemplate === toTemplate) return null;
  return { from: fromTemplate, to: toTemplate };
}

/**
 * The promotion already holding the fallback spot for a `(placement, target)`
 * pair, or null if the spot is free.
 *
 * The backend has no uniqueness constraint here at all (`CONTRACT.md` §1), and
 * the failure it allows is quiet rather than loud: two fallbacks in one slot
 * both stay hidden while a campaign runs, then both appear the moment it ends.
 * So the block is ours to enforce.
 *
 * Archived promotions do not count — an archived banner cannot render, so it
 * cannot be holding anything.
 */
export function findConflictingFallback(
  promotions: Promotion[],
  candidate: {
    id?: string;
    placement: string;
    /** Always null on a slot that is not targetable — the field is ignored there. */
    targetCategorySlug: string | null;
  },
): Promotion | null {
  return (
    promotions.find(
      (p) =>
        p.id !== candidate.id &&
        p.isFallback &&
        p.status !== "ARCHIVED" &&
        p.placement === candidate.placement &&
        (p.targetCategorySlug ?? null) === candidate.targetCategorySlug,
    ) ?? null
  );
}
