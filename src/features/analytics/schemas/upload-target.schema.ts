import { z } from "zod";

/** Validation for the "set daily upload target" dialog. */
export const uploadTargetSchema = z.object({
  dailyTarget: z
    .number()
    .int()
    .min(1, "Must be at least 1")
    .max(1000, "That seems too high"),
  note: z.string().max(280, "Keep the note under 280 characters").optional(),
});

export type UploadTargetInput = z.infer<typeof uploadTargetSchema>;
