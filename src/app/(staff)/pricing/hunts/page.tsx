import type { Metadata } from "next";

import { HuntsListView } from "@/features/hunts";

export const metadata: Metadata = {
  title: "Treasure hunts",
};

/**
 * Treasure hunts: secret five-minute drops inside a public window. Beside
 * Deals because every drop is a Deal underneath, and a Deal can collide with a
 * standing markup on the same product.
 */
export default function HuntsPage() {
  return <HuntsListView />;
}
