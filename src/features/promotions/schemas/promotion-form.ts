import { z } from "zod";

/**
 * Promotion metadata form — used by both the create shell and the detail
 * page's edit panel. Slides (images, links) are managed separately; this only
 * covers title/description/schedule.
 */
export const promotionFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give the promotion a title")
      .max(200, "Title is too long"),
    description: z.string().trim().max(2000, "Description is too long").optional(),
    // datetime-local inputs hand back "" for an empty field, not undefined.
    startAt: z.string().optional(),
    endAt: z.string().optional(),
  })
  .refine(
    (v) => !v.startAt || !v.endAt || new Date(v.startAt) < new Date(v.endAt),
    { message: "End date must be after the start date", path: ["endAt"] },
  );

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;
