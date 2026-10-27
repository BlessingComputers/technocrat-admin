"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/lib/auth/permission-gate";
import { usePreorder } from "../api/preorder.queries";
import { PreordersAccessGate } from "./preorders-access-gate";
import { PreorderDetailSkeleton } from "./preorders-skeletons";
import { PreorderStatusPanel } from "./detail/preorder-status-panel";
import { PreorderRequestCard } from "./detail/preorder-request-card";
import { PreorderDeliveryCard } from "./detail/preorder-delivery-card";
import { PreorderContactCard } from "./detail/preorder-contact-card";
import { PreorderPaymentSummary } from "./detail/preorder-payment-summary";
import { PreorderPaymentTermsForm } from "./detail/preorder-payment-terms-form";
import { PreorderPaymentHistory } from "./detail/preorder-payment-history";
import { PreorderPaymentChanges } from "./detail/preorder-payment-changes";
import { PreorderBalancePanel } from "./detail/preorder-balance-panel";
import { PreorderClosurePanel } from "./detail/preorder-closure-panel";
import { preorderCustomerName } from "../utils/preorder-utils";
import { PREORDER_PERMISSIONS } from "../constants/preorder-permissions";

interface PreorderDetailViewProps {
  preorderId: string;
}

/** Pre-order detail (route `/preorders/[id]`). `preorderId` is the row UUID. */
export function PreorderDetailView({ preorderId }: PreorderDetailViewProps) {
  return (
    <PreordersAccessGate>
      <PreorderDetail preorderId={preorderId} />
    </PreordersAccessGate>
  );
}

function PreorderDetail({ preorderId }: PreorderDetailViewProps) {
  const { data: preorder, isLoading, isError } = usePreorder(preorderId);

  if (isLoading) return <PreorderDetailSkeleton />;
  if (isError || !preorder) return <PreorderNotFound />;

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title={preorderCustomerName(preorder)}
        description={preorder.productName}
      >
        <Link
          href="/preorders"
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary-ink transition-colors"
        >
          <AppIcon icon="solar:arrow-left-linear" className="w-3 h-3" />
          Back to Pre-orders
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <PreorderStatusPanel preorder={preorder} />
          <PreorderClosurePanel preorder={preorder} />
          {preorder.paymentSummary ? (
            <>
              <PreorderPaymentSummary summary={preorder.paymentSummary} editable={preorder.status !== "CANCELLED" && preorder.status !== "FULFILLED"} />
              <PreorderPaymentChanges preorder={preorder} />
              <PreorderBalancePanel preorder={preorder} />
              <PreorderPaymentHistory preorderId={preorder.id} />
            </>
          ) : preorder.status === "CONTACTED" ? (
            <PermissionGate permission={PREORDER_PERMISSIONS.issueTerms}>
              <PreorderPaymentTermsForm preorder={preorder} />
            </PermissionGate>
          ) : null}
          <PreorderRequestCard preorder={preorder} />
          <PreorderDeliveryCard preorder={preorder} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <PreorderContactCard preorder={preorder} />
        </div>
      </div>
    </div>
  );
}

function PreorderNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-3">
      <AppIcon
        icon="solar:file-corrupted-linear"
        className="w-12 h-12 text-muted-foreground/40"
      />
      <h2 className="text-lg font-semibold text-foreground">
        Pre-order not found
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        It may have been removed, or the link points at a reference code rather
        than the record&apos;s own id.
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/preorders">Back to Pre-orders</Link>
      </Button>
    </div>
  );
}
