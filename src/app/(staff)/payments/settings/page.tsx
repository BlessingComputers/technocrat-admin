import type { Metadata } from "next";
import { PaymentsSettingsView } from "@/features/payments";

export const metadata: Metadata = {
  title: "Payments · Settings",
};

export default function PaymentsSettingsPage() {
  return <PaymentsSettingsView />;
}
