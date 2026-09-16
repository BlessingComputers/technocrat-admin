import type { Metadata } from "next";

import { DealsListView } from "@/features/deals";

export const metadata: Metadata = {
  title: "Deals",
};

/**
 * Deals: a named sale run over any mix of products and parts, as opposed to the
 * standing pricing policy next door in Markup.
 *
 * Both end up as the same backend rows — a markup rule with a negative
 * percentage — which is why Deals sits beside Markup rather than under
 * Marketing, and why starting a deal can destroy a markup at the same scope.
 */
export default function DealsPage() {
  return <DealsListView />;
}
