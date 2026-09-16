import { z } from "zod";
import { PLACEMENT_KEYS, type PlacementKey } from "../constants/placements";

/**
 * Promotion metadata form — used by both the create shell and the detail
 * page's edit panel. Slides (images, links) are managed separately; this
 * covers title/description/schedule and where the banner renders.
 *
 * `position` is deliberately absent: it is set by dragging a card in the
 * grouped list, not typed into a field (plan §6.2).
 */
export const promotionFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give the promotion a title")
      .max(200, "Title is too long"),
    description: z.string().trim().max(2000, "Description is too long").optional(),
    /**
     * Required, and only ever one of our own keys. The backend validates shape
     * only (non-empty, ≤64 chars) and would happily store a typo that then
     * renders nowhere, so the narrowing happens here.
     */
    placement: z.enum(PLACEMENT_KEYS as [PlacementKey, ...PlacementKey[]], {
      message: "Choose where this banner appears",
    }),
    isFallback: z.boolean(),
    /** Blank on a slot that is not targetable; "" is normalised to null on submit. */
    targetCategorySlug: z.string().trim().max(120).nullable(),
    // datetime-local inputs hand back "" for an empty field, not undefined.
    startAt: z.string().optional(),
    endAt: z.string().optional(),
  })
  .refine(
    (v) => !v.startAt || !v.endAt || new Date(v.startAt) < new Date(v.endAt),
    { message: "End date must be after the start date", path: ["endAt"] },
  );

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;
