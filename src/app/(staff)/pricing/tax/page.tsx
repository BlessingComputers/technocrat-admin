import type { Metadata } from "next";

import { TaxWorkspaceView } from "@/features/tax";

export const metadata: Metadata = {
  title: "Tax",
};

/**
 * Store tax. Was the third tab of `/pricing`; now its own route. The view gates
 * itself on `tax:manage` and renders a no-access card without it, so a
 * deep-link from someone who lacks the permission explains itself rather than
 * bouncing.
 */
export default function TaxPage() {
  return <TaxWorkspaceView />;
}
