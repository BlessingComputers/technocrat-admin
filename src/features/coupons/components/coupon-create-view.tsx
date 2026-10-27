"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/error-message";
import { useCreateCoupon } from "../api/coupons.queries";
import { toCreateInput, type CouponFormParsed } from "../schemas/coupon-form";
import { CouponsAccessGate } from "./coupons-access-gate";
import { CouponForm } from "./coupon-form";

/** Mint a coupon (route `/coupons/new`). */
export function CouponCreateView() {
  return (
    <CouponsAccessGate>
      <CreateForm />
    </CouponsAccessGate>
  );
}

function CreateForm() {
  const router = useRouter();
  const createCoupon = useCreateCoupon();

  const handleSubmit = (values: CouponFormParsed) => {
    const promise = createCoupon.mutateAsync(toCreateInput(values));

    toast.promise(promise, {
      loading: "Creating coupon…",
      // The code is the point of the success message, not decoration: when the
      // server generated it, this toast is the first time anyone sees it.
      success: (coupon) =>
        coupon.status === "ACTIVE"
          ? `${coupon.code} is live.`
          : `${coupon.code} is saved and switched off.`,
      error: (err) =>
        // A duplicate code comes back 409 with the backend's own message
        // naming the code, which is more useful than anything we could write.
        getErrorMessage(err, "Could not create this coupon."),
    });

    promise.then(() => router.push("/coupons")).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New coupon"
        description="A code customers type at checkout for money off their order"
      >
        <Button asChild variant="outline">
          <Link href="/coupons" className="gap-2">
            <AppIcon icon="solar:arrow-left-linear" className="size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="p-6">
        <CouponForm
          onSubmit={handleSubmit}
          isPending={createCoupon.isPending}
          submitLabel="Create coupon"
        />
      </Card>
    </div>
  );
}
