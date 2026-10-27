import {
  isPlacementKey,
  type PlacementKey,
} from "../constants/placements";
import type { Promotion, PromotionReorderEntry } from "../types/promotions";

export interface GroupedPromotions {
  /** Sparse: only slots that actually hold something get a key. */
  placed: Partial<Record<PlacementKey, Promotion[]>>;
  /**
   * Rows whose `placement` is not a key this build knows — a slot the
   * storefront has dropped, or a value written by hand. They render nowhere
   * on the site, so the list surfaces them rather than hiding them (§7).
   */
  unplaced: Promotion[];
}

/** Position first, then oldest-first, so the order is stable across refetches. */
function byPosition(a: Promotion, b: Promotion): number {
  if (a.position !== b.position) return a.position - b.position;
  return a.createdAt.localeCompare(b.createdAt);
}

export function groupByPlacement(promotions: Promotion[]): GroupedPromotions {
  const placed: Partial<Record<PlacementKey, Promotion[]>> = {};
  const unplaced: Promotion[] = [];

  for (const promotion of promotions) {
    if (isPlacementKey(promotion.placement)) {
      (placed[promotion.placement] ??= []).push(promotion);
    } else {
      unplaced.push(promotion);
    }
  }

  for (const key of Object.keys(placed) as PlacementKey[]) {
    placed[key]!.sort(byPosition);
  }
  unplaced.sort(byPosition);

  return { placed, unplaced };
}

export interface ReorderResult {
  /** The whole list with the move applied, for optimistic rendering. */
  promotions: Promotion[];
  /**
   * What to send to `PATCH /promotions/reorder`. Covers every row whose
   * placement or position actually changed, and — when the move crosses slots
   * — both the slot it left and the slot it joined, since leaving a gap
   * renumbers the old one too.
   */
  entries: PromotionReorderEntry[];
}

/**
 * Move one promotion to `targetIndex` within `targetPlacement`.
 *
 * `targetIndex` is an index into the target slot as it looks *before* the move,
 * which is what a drop on the card currently sitting at that index means. A
 * drop past the end (the group's own padding) appends.
 *
 * Returns `null` when the move is a no-op, so the caller can skip the write
 * rather than fire a request that changes nothing.
 */
export function reorderWithin(
  promotions: Promotion[],
  draggedId: string,
  targetPlacement: PlacementKey,
  targetIndex: number,
): ReorderResult | null {
  const dragged = promotions.find((p) => p.id === draggedId);
  if (!dragged) return null;

  const sourcePlacement = dragged.placement;
  const sameSlot = sourcePlacement === targetPlacement;

  const target = promotions
    .filter((p) => p.placement === targetPlacement && p.id !== draggedId)
    .sort(byPosition);

  // Where the card sat before the move. Dropping a card on itself, or on the
  // slot immediately after itself, means nothing moved.
  const originalIndex = sameSlot
    ? promotions
        .filter((p) => p.placement === targetPlacement)
        .sort(byPosition)
        .findIndex((p) => p.id === draggedId)
    : -1;
  if (sameSlot && (targetIndex === originalIndex || targetIndex === originalIndex + 1)) {
    return null;
  }

  // A drop index counted against the pre-move list shifts left by one once the
  // dragged card is pulled out of the same slot ahead of it.
  const insertAt =
    sameSlot && targetIndex > originalIndex ? targetIndex - 1 : targetIndex;
  const clamped = Math.max(0, Math.min(insertAt, target.length));
  target.splice(clamped, 0, dragged);

  const nextPosition = new Map<string, { placement: string; position: number }>();
  target.forEach((p, index) =>
    nextPosition.set(p.id, { placement: targetPlacement, position: index }),
  );

  // Pulling a card out of another slot leaves a gap in its numbering. Close it
  // in the same payload — the endpoint is transactional, so it costs nothing.
  if (!sameSlot) {
    promotions
      .filter((p) => p.placement === sourcePlacement && p.id !== draggedId)
      .sort(byPosition)
      .forEach((p, index) =>
        nextPosition.set(p.id, { placement: sourcePlacement, position: index }),
      );
  }

  const entries: PromotionReorderEntry[] = [];
  const next = promotions.map((promotion) => {
    const change = nextPosition.get(promotion.id);
    if (!change) return promotion;
    if (
      change.placement === promotion.placement &&
      change.position === promotion.position
    ) {
      return promotion;
    }
    entries.push({
      id: promotion.id,
      placement: change.placement,
      position: change.position,
    });
    return { ...promotion, ...change };
  });

  return entries.length > 0 ? { promotions: next, entries } : null;
}
