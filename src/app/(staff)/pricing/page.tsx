import type { Metadata } from "next";
import { Suspense } from "react";

import { PricingWorkspace } from "./pricing-workspace";

export const metadata: Metadata = {
  title: "Pricing",
};

/**
 * Standalone pricing route. Markup rules used to live inside the catalogue
 * (`/products/pricing` + `/products/parts/pricing`); they now share this
 * top-level page as Products / Parts tabs. `Suspense` covers the `useSearchParams`
 * read in the tab shell.
 */
export default function PricingPage() {
  return (
    <Suspense>
      <PricingWorkspace />
    </Suspense>
  );
}
