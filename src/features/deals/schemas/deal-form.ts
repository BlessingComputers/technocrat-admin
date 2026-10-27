import { z } from "zod";

import {
  DEAL_MAX_DISCOUNT_PERCENT,
  DEAL_MAX_TARGETS,
  DEAL_MIN_DISCOUNT_PERCENT,
} from "../types/deals";

/**
 * Deal form input (ADR-0006: Zod owns request/form inputs).
 *
 * The discount is held as a POSITIVE magnitude here and negated on submit —
 * the backend refuses a target whose `markupPercentage` is not negative, and a
 * form that asks staff to type a minus sign invites the one typo that turns a
 * sale into a price rise.
 *
 * There is no `startsAt`. This form only creates drafts: a SCHEDULED deal
 * cannot be edited, cancelled or deleted before it fires (backend ask 28), so
 * nothing here should be able to arm something that cannot be disarmed.
 */

const targetScope = z.object({
  entityType: z.enum(["product", "part"]),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  productId: z.string().optional(),
  partTypeId: z.string().optional(),
  partId: z.string().optional(),
  discountPercent: z
    .number({ message: "Enter a discount" })
    .min(
      DEAL_MIN_DISCOUNT_PERCENT,
      `Minimum discount is ${DEAL_MIN_DISCOUNT_PERCENT}%`,
    )
    .max(
      DEAL_MAX_DISCOUNT_PERCENT,
      `Maximum discount is ${DEAL_MAX_DISCOUNT_PERCENT}%`,
    ),
  /**
   * The chosen item's name, carried so the detail page can label an exact-item
   * target without a catalogue lookup. Display only — see `targetScopeLabel`.
   */
  label: z.string().max(500).optional(),
});

export const dealTargetSchema = targetScope
  .refine(
    (t) =>
      Boolean(
        t.productId || t.partId || t.categoryId || t.brandId || t.partTypeId,
      ),
    {
      message: "Pick something for this target to cover",
      path: ["productId"],
    },
  )
  // The backend applies the same either/or per target as the flash-sale
  // endpoints do per rule: an exact item stands alone, because it already
  // implies its own category, brand and type.
  .refine((t) => !(t.productId && (t.categoryId || t.brandId)), {
    message: "A product target stands alone — drop the category or brand",
    path: ["productId"],
  })
  .refine(
    (t) => !(t.partId && (t.categoryId || t.brandId || t.partTypeId)),
    {
      message: "A part target stands alone — drop the category, brand or type",
      path: ["partId"],
    },
  )
  // Entity type decides which id fields are even legal. Crossing them would be
  // a 400 with no field pointer, so catch it here.
  .refine((t) => !(t.entityType === "product" && (t.partId || t.partTypeId)), {
    message: "A product target can’t carry a part or part type",
    path: ["entityType"],
  })
  .refine((t) => !(t.entityType === "part" && t.productId), {
    message: "A part target can’t carry a product",
    path: ["entityType"],
  });

export const dealFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give the deal a name")
    .max(120, "That name is too long"),
  /** ISO string, or null for a deal that runs until it is ended by hand. */
  expiresAt: z.string().nullable(),
  allowCouponStacking: z.boolean(),
  notes: z.string().max(500, "Notes are too long").optional(),
  targets: z
    .array(dealTargetSchema)
    .min(1, "A deal needs at least one target")
    .max(DEAL_MAX_TARGETS, `A deal takes at most ${DEAL_MAX_TARGETS} targets`),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;
export type DealTargetFormValues = z.infer<typeof dealTargetSchema>;
