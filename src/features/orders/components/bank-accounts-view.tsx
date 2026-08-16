"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from "../api/orders.queries";
import type { AdminBankAccount } from "../types/orders";
import { BankAccountsGrid } from "./bank-accounts/bank-accounts-grid";
import { BankAccountsGridSkeleton } from "./bank-accounts/bank-accounts-grid-skeleton";
import { BankAccountFormDialog } from "./bank-accounts/bank-account-form-dialog";
import {
  bankAccountToFormData,
  type BankAccountFormData,
} from "../schemas/bank-account-form";

/** Bank Accounts view (route `/checkout/bank-accounts`). Part of the orders feature (ADR-0002). */
export function BankAccountsView() {
  const { data: accounts = [], isLoading } = useBankAccounts();

  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminBankAccount | null>(
    null,
  );
  // Bumped on every open so the form dialog remounts with a fresh draft.
  const [formKey, setFormKey] = useState(0);

  const openCreateDialog = () => {
    setEditingAccount(null);
    setFormKey((k) => k + 1);
    setIsDialogOpen(true);
  };

  const openEditDialog = (account: AdminBankAccount) => {
    setEditingAccount(account);
    setFormKey((k) => k + 1);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: BankAccountFormData) => {
    if (editingAccount) {
      updateMutation.mutate(
        { id: editingAccount.id, data },
        { onSuccess: () => setIsDialogOpen(false) },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setIsDialogOpen(false),
      });
    }
  };

  const handleToggleActive = (account: AdminBankAccount) => {
    updateMutation.mutate({
      id: account.id,
      data: { isActive: !account.isActive },
    });
  };

  const handleMakePrimary = (account: AdminBankAccount) => {
    if (account.isPrimary) return;
    updateMutation.mutate({ id: account.id, data: { isPrimary: true } });
  };

  const handleDelete = (account: AdminBankAccount) => {
    deleteMutation.mutate(account.id);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="Bank Accounts"
        description="Manage company accounts for customer payments"
      >
        <Button
          onClick={openCreateDialog}
          className="rounded-lg bg-primary text-primary-foreground font-medium px-6 h-12"
        >
          <AppIcon icon="solar:add-circle-linear" className="mr-2 w-5 h-5" />
          Add Account
        </Button>
      </PageHeader>

      {isLoading ? (
        <BankAccountsGridSkeleton />
      ) : (
        <BankAccountsGrid
          accounts={accounts}
          onEdit={openEditDialog}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
          onMakePrimary={handleMakePrimary}
        />
      )}

      <BankAccountFormDialog
        key={formKey}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={
          editingAccount ? bankAccountToFormData(editingAccount) : null
        }
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
