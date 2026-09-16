"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  isCouponId,
  useCouponByRef,
  useUpdateCoupon,
} from "../api/coupons.queries";
import {
  isEmptyUpdate,
  toUpdateInput,
  type CouponFormParsed,
} from "../schemas/coupon-form";
import {
  couponStateHint,
  formatDate,
  isNotYetStarted,
  usageSummary,
} from "../utils/coupon-utils";
import { CouponsAccessGate } from "./coupons-access-gate";
import { CouponForm } from "./coupon-form";
import { CouponPowerAction } from "./coupon-power-action";
import { CouponStateBadge } from "./coupon-state-badge";
import { CouponFormSkeleton } from "./coupons-skeletons";
import type { Coupon } from "../types/coupons";

interface CouponEditViewProps {
  /**
   * Either the row UUID or the customer-facing code — the route accepts both.
   * See `useCouponByRef`.
   */
  couponRef: string;
}

/** Edit one coupon (route `/coupons/[ref]/edit`). */
export function CouponEditView({ couponRef }: CouponEditViewProps) {
  return (
    <CouponsAccessGate>
      <EditForm couponRef={couponRef} />
    </CouponsAccessGate>
  );
}

function EditForm({ couponRef }: CouponEditViewProps) {
  const { data: coupon, isPending, isError } = useCouponByRef(couponRef);

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl">
        {/* A UUID is not a title. While the row is in flight there is nothing
            better to show than the generic word, so a code gets named and an
            id does not. */}
        <PageHeader
          title={isCouponId(couponRef) ? "Coupon" : couponRef}
          description="Loading this coupon…"
        />
        <Card className="p-6">
          <CouponFormSkeleton />
        </Card>
      </div>
    );
  }

  // `null` is a resolved answer ("no such coupon"), not a failure, so both land
  // on the same screen — from the reader's side they are the same fact.
  if (isError || !coupon) return <CouponNotFound couponRef={couponRef} />;

  return <LoadedEditForm coupon={coupon} />;
}

function LoadedEditForm({ coupon }: { coupon: Coupon }) {
  const router = useRouter();
  const updateCoupon = useUpdateCoupon();

  const handleSubmit = (values: CouponFormParsed) => {
    const input = toUpdateInput(values, coupon);

    // The backend answers an empty PATCH with "Provide at least one field to
    // update" — a 400 that reads like a bug. Say the true thing instead.
    if (isEmptyUpdate(input)) {
      toast("Nothing has changed yet.");
      return;
    }

    const promise = updateCoupon.mutateAsync({ id: coupon.id, input });

    toast.promise(promise, {
      loading: "Saving…",
      success: (updated) => `${updated.code} updated.`,
      error: (err) => getErrorMessage(err, "Could not save this coupon."),
    });

    promise.then(() => router.push("/coupons")).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="font-mono">{coupon.code}</span>
            <CouponStateBadge coupon={coupon} />
          </span>
        }
        description={coupon.description || coupon.couponId}
      >
        <Button asChild variant="outline">
          <Link href="/coupons" className="gap-2">
            <AppIcon icon="solar:arrow-left-linear" className="size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      {/* What has already happened, before what could be changed. Redemptions
          are the fact that makes every decision below consequential — they are
          permanent, and no edit here takes one back. */}
      <Card className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-8">
          <Fact label="Redeemed">{usageSummary(coupon)}</Fact>
          <Fact label="Created">{formatDate(coupon.createdAt)}</Fact>
          {/* Only when it is actually ahead of us. `startsAt` defaults to the
              creation time, so on almost every coupon it would just repeat the
              row above it. Shown when it differs, because a coupon that cannot
              be redeemed yet is the one fact that explains the badge. */}
          {isNotYetStarted(coupon) && (
            <Fact label="Opens">{formatDate(coupon.startsAt)}</Fact>
          )}
          <Fact label="Reference">
            <span className="font-mono text-xs">{coupon.couponId}</span>
          </Fact>
        </div>
        <CouponPowerAction coupon={coupon} size="default" />
      </Card>

      <p className="mb-6 text-xs text-muted-foreground">
        {couponStateHint(coupon)}
      </p>

      <Card className="p-6">
        <CouponForm
          coupon={coupon}
          onSubmit={handleSubmit}
          isPending={updateCoupon.isPending}
          submitLabel="Save changes"
        />
      </Card>
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <MetaLabel className="block">{label}</MetaLabel>
      <p className="mt-0.5 text-sm font-semibold tracking-tight text-foreground">
        {children}
      </p>
    </div>
  );
}

function CouponNotFound({ couponRef }: { couponRef: string }) {
  const isId = isCouponId(couponRef);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-3 text-center">
      <AppIcon
        icon="solar:file-corrupted-linear"
        className="h-12 w-12 text-muted-foreground/40"
      />
      <h2 className="text-lg font-semibold text-foreground">
        {isId ? (
          "No such coupon"
        ) : (
          <>
            No coupon called <span className="font-mono">{couponRef}</span>
          </>
        )}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {isId
          ? "This coupon has been removed, or the link was copied incompletely."
          : null}
        {!isId && (
          <>
            Codes are case-sensitive, so{" "}
            <span className="font-mono">save20</span> and{" "}
            <span className="font-mono">SAVE20</span> are not the same link.
            This one may also have been renamed since the link was made.
          </>
        )}
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/coupons">Back to coupons</Link>
      </Button>
    </div>
  );
}
