import type { Metadata } from "next";
import { Suspense } from "react";

import { SettingsWorkspace } from "./settings-workspace";

export const metadata: Metadata = {
  title: "Settings",
};

/**
 * `Suspense` covers the `useSearchParams` read in the tab shell — same shape as
 * `/pricing`.
 */
export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsWorkspace />
    </Suspense>
  );
}
