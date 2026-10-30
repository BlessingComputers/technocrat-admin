import { z } from "zod";
import type { AdSpend, AdSpendBody } from "../types/ad-spend";

export const AD_PLATFORMS = ["meta", "google", "tiktok", "other"] as const;

export const AD_PLATFORM_LABEL: Record<(typeof AD_PLATFORMS)[number], string> = {
  meta: "Meta (Facebook, Instagram)",
  google: "Google",
  tiktok: "TikTok",
  other: "Other",
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** "₦250,000" → 250000. NaN when there's no number in it. */
export const parseAmount = (value: string) => {
  const cleaned = value.replace(/[₦,\s]/g, "");
  return cleaned ? Number(cleaned) : Number.NaN;
};

/**
 * Validation for the ad spend form. Values stay strings, as the inputs hold
 * them; `toAdSpendBody` turns them into what the backend takes. The backend
 * repeats these checks and answers with typed 400s.
 */
export const adSpendSchema = z
  .object({
    platform: z.enum(AD_PLATFORMS),
    campaign: z.string().trim().min(1, "Enter the campaign's utm_campaign").max(200),
    adContent: z.string().trim().max(200),
    startDate: z.string().regex(YMD, "Pick a start date"),
    endDate: z.string().regex(YMD, "Pick an end date"),
    amount: z.string().refine((v) => parseAmount(v) > 0, "Enter an amount above 0"),
    note: z.string().trim().max(500),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "The end date can't be before the start date",
  });

export type AdSpendFormValues = z.infer<typeof adSpendSchema>;

export function toAdSpendBody(values: AdSpendFormValues): AdSpendBody {
  return {
    platform: values.platform,
    campaign: values.campaign.trim(),
    adContent: values.adContent.trim() || null,
    startDate: values.startDate,
    endDate: values.endDate,
    amount: parseAmount(values.amount),
    note: values.note.trim() || null,
  };
}

export function toFormValues(entry?: AdSpend): AdSpendFormValues {
  return {
    platform: entry?.platform ?? "meta",
    campaign: entry?.campaign ?? "",
    adContent: entry?.adContent ?? "",
    startDate: entry?.startDate ?? "",
    endDate: entry?.endDate ?? "",
    amount: entry ? String(entry.amount) : "",
    note: entry?.note ?? "",
  };
}
