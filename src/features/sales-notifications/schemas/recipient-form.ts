import { z } from "zod";

/**
 * Recipient form. Mirrors the backend's
 * `createSalesNotificationEmailSchema` — same limits, friendlier copy — so the
 * form rejects what the API would reject without a round-trip.
 *
 * The one thing this schema CANNOT check is uniqueness: `email` is unique in
 * the database and the duplicate comes back as a 409. That's handled in the
 * dialog as an inline field error, not here.
 */
export const recipientFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter an email address")
    .max(255, "That email address is too long")
    .email("That doesn’t look like a valid email address"),
  // Optional on the backend (nullable VarChar(100)). Empty string is normalised
  // to `undefined` by the dialog before it gets here.
  label: z.string().trim().max(100, "Keep the label under 100 characters").optional(),
  isActive: z.boolean(),
});

export type RecipientFormValues = z.infer<typeof recipientFormSchema>;
