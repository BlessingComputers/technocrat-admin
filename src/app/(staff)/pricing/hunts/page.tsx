import type { Metadata } from "next";
import { Suspense } from "react";

import { HuntsWorkspace } from "@/features/hunts";

export const metadata: Metadata = {
  title: "Treasure hunts",
};

/**
 * Treasure hunts: secret five-minute drops inside a public window. Beside
 * Deals because every drop is a Deal underneath, and a Deal can collide with a
 * standing markup on the same product.
 *
 * `Suspense` covers the `useSearchParams` read in the client shell.
 */
export default function HuntsPage() {
  return (
    <Suspense>
      <HuntsWorkspace />
    </Suspense>
  );
}
