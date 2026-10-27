import type { Metadata } from "next";

import { HuntFormView } from "@/features/hunts";

export const metadata: Metadata = {
  title: "New treasure hunt",
};

/**
 * Create a campaign. A route rather than a dialog: four to twenty drops, each
 * with a product, a price and three times, is a long form.
 */
export default function NewHuntPage() {
  return <HuntFormView />;
}
