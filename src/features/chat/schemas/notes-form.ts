import { z } from "zod";

/**
 * Validation for the CRM Notes panel. Mirrors the `chat:notes:update` socket
 * payload — all 12 documented note fields (#28), so agents can record
 * everything the contract persists.
 */
export const notesFormSchema = z.object({
  leadName: z.string().max(120).optional().or(z.literal("")),
  leadEmail: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  leadPhone: z.string().max(30).optional().or(z.literal("")),
  leadAddress: z.string().max(280).optional().or(z.literal("")),
  // "" tolerated: the Select can report a cleared value; the save handler
  // maps it to undefined so blanks never overwrite a stored status.
  leadStatus: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"])
    .optional()
    .or(z.literal("")),
  productsDiscussed: z.string().max(280).optional().or(z.literal("")),
  pricesDiscussed: z.string().max(280).optional().or(z.literal("")),
  budgetRange: z.string().max(120).optional().or(z.literal("")),
  customerIntent: z.string().max(280).optional().or(z.literal("")),
  handoverNotes: z
    .string()
    .max(2000, "Keep handover notes under 2000 characters")
    .optional()
    .or(z.literal("")),
  /** ISO date (yyyy-mm-dd) from the date input. */
  followUpDate: z.string().optional().or(z.literal("")),
  followUpNote: z
    .string()
    .max(2000, "Keep the note under 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type NotesFormInput = z.infer<typeof notesFormSchema>;
