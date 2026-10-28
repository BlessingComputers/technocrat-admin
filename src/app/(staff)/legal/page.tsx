import type { Metadata } from "next";

import { LegalWorkspaceView } from "@/features/legal";

export const metadata: Metadata = {
  title: "Legal",
};

/**
 * Legal policies. The view gates itself on `policy:versions:read` and renders a
 * no-access card without it, so a deep link from someone who lacks the
 * permission explains itself rather than bouncing.
 */
export default function LegalPage() {
  return <LegalWorkspaceView />;
}
