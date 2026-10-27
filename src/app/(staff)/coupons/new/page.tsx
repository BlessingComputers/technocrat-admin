import type { Metadata } from "next";
import { CouponCreateView } from "@/features/coupons";

export const metadata: Metadata = {
  title: "New Coupon",
};

export default function NewCouponPage() {
  return <CouponCreateView />;
}
