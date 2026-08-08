"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import PageContainer from "@/components/layouts/page-container";
import {
  useInvoiceDetail,
  useReassignInvoice,
  useSubmitReview,
} from "../api/invoice.queries";
import { RefundItemsModal } from "./refund-items-modal";
import { InvoiceSummaryCard } from "./detail/invoice-summary-card";
import { InvoiceCustomerCard } from "./detail/invoice-customer-card";
import { InvoiceItemsCard } from "./detail/invoice-items-card";
import { InvoiceAmountSummary } from "./detail/invoice-amount-summary";
import { InvoiceTimeline } from "./detail/invoice-timeline";
import { InvoiceNotesCard } from "./detail/invoice-notes-card";
import { InvoiceReviewPanel } from "./detail/invoice-review-panel";
import { InvoiceDetailSkeleton } from "./invoice-skeletons";
import type {
  CustomerDecision,
  ProductAvailability,
} from "../types/invoice";

interface InvoiceDetailViewProps {
  invoiceId: string;
}

/** Invoice detail view (route `/invoices/[id]`). Screens 2, 5, 6, 7. */
export function InvoiceDetailView({ invoiceId }: InvoiceDetailViewProps) {
  const { data: invoice, isLoading } = useInvoiceDetail(invoiceId);
  const submitReview = useSubmitReview();
  const reassign = useReassignInvoice();
  const [refundOpen, setRefundOpen] = useState(false);

  if (isLoading) return <InvoiceDetailSkeleton />;
  if (!invoice) return <InvoiceNotFound />;

  const showReview =
    invoice.invoiceType === "OUTSOURCED" && invoice.status === "PAID";
  const canRefund =
    invoice.status === "REJECTED" || invoice.status === "PARTIALLY_APPROVED";

  function handleSubmit(
    availability: ProductAvailability,
    decision: CustomerDecision | undefined,
  ) {
    if (!invoice) return;
    const itemReviews = invoice.lineItems.map((item) => ({
      orderItemId: item.orderItemId ?? item.id,
      productAvailability: availability,
      customerDecision: decision,
    }));
    submitReview.mutate({ invoiceId: invoice.invoiceId, itemReviews });
  }

  function handleReassign() {
    if (!invoice?.representative) return;
    reassign.mutate({
      invoiceId: invoice.invoiceId,
      staffId: invoice.representative.staffId,
    });
  }

  return (
    <PageContainer className="pb-16">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <AppIcon icon="solar:arrow-left-linear" className="h-4 w-4" />
            Back
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Invoice Details
          </h1>
        </div>
        {canRefund && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setRefundOpen(true)}
            className="h-10 gap-2 rounded-lg px-5 font-medium"
          >
            <AppIcon icon="solar:dollar-minimalistic-linear" className="h-4 w-4" />
            Process Refund
          </Button>
        )}
      </div>

      <InvoiceSummaryCard invoice={invoice} />
      <InvoiceCustomerCard invoice={invoice} />
      <InvoiceItemsCard items={invoice.lineItems} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InvoiceAmountSummary invoice={invoice} />
        <InvoiceTimeline timeline={invoice.timeline} />
      </div>

      {showReview ? (
        <InvoiceReviewPanel
          invoice={invoice}
          onSubmit={handleSubmit}
          isSubmitting={submitReview.isPending}
          onReassign={handleReassign}
          isReassigning={reassign.isPending}
        />
      ) : (
        invoice.notes && <InvoiceNotesCard notes={invoice.notes} />
      )}

      <RefundItemsModal
        open={refundOpen}
        onOpenChange={setRefundOpen}
        invoiceId={invoice.invoiceId}
        items={invoice.lineItems}
      />
    </PageContainer>
  );
}

function InvoiceNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <AppIcon
        icon="solar:danger-circle-linear"
        className="h-16 w-16 text-destructive"
      />
      <h2 className="text-2xl font-bold text-foreground">Invoice Not Found</h2>
      <p className="font-medium text-muted-foreground">
        The invoice you are looking for does not exist.
      </p>
      <Link href="/invoices">
        <Button variant="outline" className="rounded-lg px-8 font-medium">
          Return to Invoices
        </Button>
      </Link>
    </div>
  );
}
