import type { Metadata } from "next";
import { CouponsListView } from "@/features/coupons";

export const metadata: Metadata = {
  title: "Coupons",
};

export default function CouponsPage() {
  return <CouponsListView />;
}
