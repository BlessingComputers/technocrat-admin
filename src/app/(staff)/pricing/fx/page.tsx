import type { Metadata } from "next";

import { FxWorkspaceView } from "@/features/fx";

export const metadata: Metadata = {
  title: "Dollar pricing",
};

/**
 * Dollar pricing (FX, ask 45): coverage, the link tool, standing links and the
 * decision log. The view gates itself on `products:read`.
 */
export default function FxPage() {
  return <FxWorkspaceView />;
}
