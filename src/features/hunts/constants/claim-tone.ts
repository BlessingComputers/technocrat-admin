import type { ClaimTone } from "../utils/hunt-rows";

/** Text colour for a claim line. Ink tokens, so each clears AA on the card. */
export const CLAIM_TONE_TEXT: Record<ClaimTone, string> = {
  success: "text-success-ink",
  warning: "text-warning-ink",
  info: "text-info-ink",
  muted: "text-muted-foreground",
};

/** The pill shape every badge on the hunt screens shares. */
export const HUNT_PILL = "rounded-full py-0.5 text-xs font-semibold";
