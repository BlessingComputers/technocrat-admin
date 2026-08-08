import type { Metadata } from "next";
import { PendingReviewView } from "@/features/invoice";

export const metadata: Metadata = {
  title: "Pending Review",
};

export default function PendingReviewPage() {
  return <PendingReviewView />;
}
