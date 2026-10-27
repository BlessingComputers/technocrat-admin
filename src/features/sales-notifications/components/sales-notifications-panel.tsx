"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";

import {
  useCreateSalesNotificationEmail,
  useDeleteSalesNotificationEmail,
  useSalesNotificationEmails,
  useUpdateSalesNotificationEmail,
} from "../api/sales-notifications.queries";
import { isDuplicateEmailError } from "../utils/duplicate-email";
import {
  RecipientFormDialog,
  type RecipientFormSubmit,
} from "./recipient-form-dialog";
import { RecipientsTable, type RecipientRow } from "./recipients-table";

/**
 * Sales notification recipients — the list the "new sale" email goes to.
 *
 * Owns its own queries and mutations; the table and dialog below it stay
 * presentational. The one non-obvious flow is the duplicate email: the backend
 * answers a clash with a 409, which we route to the dialog as an inline field
 * error instead of a toast, because it's a correction the user makes right
 * there in the field (see `duplicateEmail` on the dialog).
 */
export function SalesNotificationsPanel() {
  const { data: recipients = [], isLoading, isError, refetch } =
    useSalesNotificationEmails();

  const createMutation = useCreateSalesNotificationEmail();
  const updateMutation = useUpdateSalesNotificationEmail();
  const deleteMutation = useDeleteSalesNotificationEmail();

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);
  // Bumped on every open so the dialog remounts with fresh seed state (the
  // codebase's form-dialog reset pattern — no setState-in-effect sync).
  const [formKey, setFormKey] = useState(0);

  const byId = useMemo(
    () => new Map(recipients.map((r) => [r.id, r])),
    [recipients],
  );

  const rows: RecipientRow[] = useMemo(
    () =>
      recipients.map((r) => ({
        id: r.id,
        email: r.email,
        label: r.label,
        isActive: r.isActive,
        addedByName: r.createdBy
          ? `${r.createdBy.firstName} ${r.createdBy.lastName}`.trim()
          : "—",
      })),
    [recipients],
  );

  const editTarget = editId ? (byId.get(editId) ?? null) : null;
  const deleteTarget = deleteId ? (byId.get(deleteId) ?? null) : null;

  // A list that exists but has nobody active is the silent-failure case: the
  // backend skips the job and logs it, so no email and no error anywhere.
  const activeCount = recipients.filter((r) => r.isActive).length;
  const hasPausedOnly = recipients.length > 0 && activeCount === 0;

  const openCreate = () => {
    setEditId(null);
    setDuplicateEmail(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setDuplicateEmail(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleSubmit = async (values: RecipientFormSubmit) => {
    try {
      if (editId) {
        // `label` goes as null, not undefined, when cleared — the backend's
        // update schema treats undefined as "leave it alone".
        await updateMutation.mutateAsync({
          id: editId,
          data: {
            email: values.email,
            label: values.label ?? null,
            isActive: values.isActive,
          },
        });
        toast.success("Recipient updated.");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Recipient added.");
      }
      setDuplicateEmail(null);
      setFormOpen(false);
    } catch (err) {
      // The duplicate is the user's to fix in the field — keep the dialog open
      // and say so there rather than firing a toast they'd have to remember.
      if (isDuplicateEmailError(err)) {
        setDuplicateEmail(values.email);
        return;
      }
      toast.error(
        getErrorMessage(
          err,
          editId ? "Failed to update recipient." : "Failed to add recipient.",
        ),
      );
    }
  };

  const handleToggleActive = async (id: string) => {
    const target = byId.get(id);
    if (!target) return;
    const next = !target.isActive;
    setTogglingId(id);
    try {
      await updateMutation.mutateAsync({ id, data: { isActive: next } });
      toast.success(
        next
          ? `${target.email} will receive sale emails again.`
          : `${target.email} paused — no more sale emails.`,
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update recipient."));
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const promise = deleteMutation.mutateAsync(deleteId);
    toast.promise(promise, {
      loading: "Removing recipient…",
      success: "Recipient removed.",
      error: (err) => getErrorMessage(err, "Failed to remove recipient."),
    });
    promise.then(() => setDeleteId(null)).catch(() => {});
  };

  const hasRecipients = rows.length > 0;
  // Pause/resume runs through the same mutation as the form, so gate the
  // dialog's spinner on the form path only.
  const isFormSubmitting =
    createMutation.isPending || (updateMutation.isPending && !togglingId);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Everyone here gets an email the moment a customer’s payment goes
          through. The list is read fresh on every sale, so an address added now
          receives the next one.
        </p>
        {/* Only show the header action once recipients exist — the empty state
            owns the first-run CTA, so we don't double up. */}
        {hasRecipients && (
          <Button
            onClick={openCreate}
            className="h-9 shrink-0 rounded-lg bg-primary font-medium text-primary-foreground"
          >
            <AppIcon icon="solar:add-circle-linear" className="mr-2 size-4" />
            Add Recipient
          </Button>
        )}
      </div>

      {hasPausedOnly && (
        <Alert className="border-warning/30 bg-warning/10">
          <AppIcon
            icon="solar:bell-off-linear"
            className="size-4 text-warning-ink"
          />
          <AlertTitle className="text-sm font-semibold">
            Nobody is receiving sale emails
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Every recipient is paused, so completed sales send nothing. Resume
            at least one address to start the emails again.
          </AlertDescription>
        </Alert>
      )}

      <Card className="gap-0 overflow-hidden p-0">
        <RecipientsTable
          rows={rows}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          onCreate={openCreate}
          onEdit={openEdit}
          onToggleActive={(id) => void handleToggleActive(id)}
          onDelete={setDeleteId}
          isTogglingId={togglingId}
        />
      </Card>

      <RecipientFormDialog
        key={formKey}
        isOpen={formOpen}
        onOpenChange={setFormOpen}
        initial={editTarget}
        onSubmit={(values) => void handleSubmit(values)}
        isSubmitting={isFormSubmitting}
        duplicateEmail={duplicateEmail}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Remove this recipient?"
        description={`${
          deleteTarget?.email ?? "This address"
        } will stop receiving sale emails and drop off the list entirely. To stop the emails but keep the entry, pause it instead.`}
        confirmText="Remove"
        variant="destructive"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
