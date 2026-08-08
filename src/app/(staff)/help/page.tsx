import type { Metadata } from "next";
import { HelpIndexView } from "@/features/help";

export const metadata: Metadata = {
  title: "Help Center",
};

export default function HelpPage() {
  return <HelpIndexView />;
}
