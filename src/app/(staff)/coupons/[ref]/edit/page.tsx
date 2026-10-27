import type { Metadata } from "next";
import { CouponEditView } from "@/features/coupons";

export const metadata: Metadata = {
  title: "Edit Coupon",
};

/**
 * Takes either the coupon's UUID or its customer-facing `code`.
 *
 * The list links by UUID, which `GET /admin/coupons/{id}` reads directly. The
 * segment also accepts a code because this route was keyed on one until
 * 2026-08-28 — back then there was no by-id endpoint at all, and a code was the
 * only thing a cold load could resolve from. Those links were shareable, so
 * they are still honoured rather than broken; a code costs a list-and-scan.
 *
 * The two can never be confused: a code is `[A-Z0-9]{3,50}` and cannot contain
 * a hyphen. See `isCouponId`.
 */
export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return <CouponEditView couponRef={decodeURIComponent(ref)} />;
}
