import type { Metadata } from "next";

import { DealFormView } from "@/features/deals";

export const metadata: Metadata = {
  title: "New deal",
};

/**
 * Create a deal. A route rather than a dialog because the target builder runs
 * to a hundred rows, and because a long form deserves its own URL.
 *
 * The view gates itself on `priceMarkup:write` and explains itself rather than
 * bouncing, so a deep link from someone without it still reads.
 */
export default function NewDealPage() {
  return <DealFormView />;
}
