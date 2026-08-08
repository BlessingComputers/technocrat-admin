import type { Metadata } from "next";
import { MonitorRequestsListView } from "@/features/monitor";

export const metadata: Metadata = {
  title: "Security",
};

/** Request/error/anomaly monitor — replaces the prior backend-blocked
 * placeholder now that `/monitor/*` has landed (SUPER_ADMIN only). */
export default function SecurityPage() {
  return <MonitorRequestsListView />;
}
