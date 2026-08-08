import { BankAccountCard } from "./bank-account-card";
import { BankAccountsEmptyState } from "./bank-accounts-empty-state";
import type { AdminBankAccount } from "../../types/orders";

interface BankAccountsGridProps {
  accounts: AdminBankAccount[];
  onEdit: (account: AdminBankAccount) => void;
  onToggleActive: (account: AdminBankAccount) => void;
  onDelete: (account: AdminBankAccount) => void;
  onMakePrimary: (account: AdminBankAccount) => void;
}

/** Responsive grid of `BankAccountCard`s, with empty-state fallback. */
export function BankAccountsGrid({
  accounts,
  onEdit,
  onToggleActive,
  onDelete,
  onMakePrimary,
}: BankAccountsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {accounts.length === 0 ? (
        <BankAccountsEmptyState />
      ) : (
        accounts.map((account) => (
          <BankAccountCard
            key={account.id}
            account={account}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
            onMakePrimary={onMakePrimary}
          />
        ))
      )}
    </div>
  );
}
