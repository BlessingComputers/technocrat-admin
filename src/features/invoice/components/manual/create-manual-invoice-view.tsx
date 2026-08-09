"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { useStaffSession } from "@/lib/auth/session-context";
import { useCreateManualInvoice } from "../../api/invoice.queries";
import {
  EMPTY_MANUAL_INVOICE_FORM,
  buildManualInvoicePayload,
  createManualInvoiceSchema,
  type ManualInvoiceFormState,
  type ManualLineItemDraft,
} from "../../schemas/manual-invoice";
import { ManualCustomerFields } from "./manual-customer-fields";
import { ManualItemsTable } from "./manual-items-table";
import { ManualChargesSummary } from "./manual-charges-summary";
import { ManualPaymentFields } from "./manual-payment-fields";
import { AddItemModal } from "./add-item-modal";

const BACK_HREF = "/invoices?tab=manual";

/** Create-manual-invoice page (route `/invoices/manual/new`, docs MI-5). */
export function CreateManualInvoiceView() {
  const router = useRouter();
  const { staffSession } = useStaffSession();
  const createMutation = useCreateManualInvoice();

  const [form, setForm] = useState<ManualInvoiceFormState>(
    EMPTY_MANUAL_INVOICE_FORM,
  );
  const [addItemKey, setAddItemKey] = useState(0);
  const [isAddItemOpen, setAddItemOpen] = useState(false);

  const issuedByName = staffSession
    ? `${staffSession.firstName} ${staffSession.lastName}`.trim()
    : "";

  const update = (patch: Partial<ManualInvoiceFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const addItem = (item: ManualLineItemDraft) =>
    setForm((prev) => ({ ...prev, lineItems: [...prev.lineItems, item] }));

  const removeItem = (index: number) =>
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));

  const openAddItem = () => {
    setAddItemKey((k) => k + 1); // remount → fresh draft
    setAddItemOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildManualInvoicePayload(form, issuedByName);
    const parsed = createManualInvoiceSchema.safeParse(payload);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    createMutation.mutate(parsed.data, {
      onSuccess: (created) => {
        const id = created?.manualInvoiceId;
        router.push(id ? `/invoices/manual/${id}` : BACK_HREF);
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div className="space-y-1">
        <Link
          href={BACK_HREF}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <AppIcon icon="solar:arrow-left-linear" className="h-3 w-3" />
          Back to invoices
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Create Invoice
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Record an offline sale where payment was already collected.
        </p>
      </div>

      <Card className="border bg-card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <ManualCustomerFields form={form} onChange={update} />

          <ManualItemsTable
            items={form.lineItems}
            onAddClick={openAddItem}
            onRemove={removeItem}
          />

          <ManualChargesSummary form={form} onChange={update} />

          <ManualPaymentFields
            form={form}
            onChange={update}
            issuedByName={issuedByName}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Button
              asChild
              type="button"
              variant="ghost"
              className="h-12 rounded-lg px-8 font-bold text-muted-foreground"
            >
              <Link href={BACK_HREF}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-12 rounded-lg bg-primary px-12 font-black text-primary-foreground"
            >
              {createMutation.isPending ? "Creating…" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </Card>

      <AddItemModal
        key={addItemKey}
        isOpen={isAddItemOpen}
        onOpenChange={setAddItemOpen}
        onAdd={addItem}
      />
    </div>
  );
}
