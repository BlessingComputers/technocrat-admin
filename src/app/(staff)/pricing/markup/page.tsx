import type { Metadata } from "next";
import { Suspense } from "react";

import { MarkupWorkspace } from "./markup-workspace";

export const metadata: Metadata = {
  title: "Markup",
};

/**
 * Markup rules, the standing pricing policy. Was the Products/Parts half of the
 * tabbed `/pricing`; it is now its own route under the sidebar Pricing group.
 * `Suspense` covers the `useSearchParams` read in the client shell.
 */
export default function MarkupPage() {
  return (
    <Suspense>
      <MarkupWorkspace />
    </Suspense>
  );
}
