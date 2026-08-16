import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type { AdminBankAccount } from "../../types/orders";
import { MetaLabel } from "@/components/shared/meta-label";

interface BankAccountCardProps {
  account: AdminBankAccount;
  onEdit: (account: AdminBankAccount) => void;
  onToggleActive: (account: AdminBankAccount) => void;
  onDelete: (account: AdminBankAccount) => void;
  onMakePrimary: (account: AdminBankAccount) => void;
}

/**
 * Single bank-account card with edit / toggle-active / delete actions and a
 * "Make Primary" button when the account is not already primary.
 */
export function BankAccountCard({
  account,
  onEdit,
  onToggleActive,
  onDelete,
  onMakePrimary,
}: BankAccountCardProps) {
  return (
    <Card
      className={cn(
        "p-8 border-2 transition-all relative overflow-hidden group",
        account.isPrimary
          ? "border-primary bg-primary/[0.03]"
          : "",
      )}
    >
      {account.isPrimary && <PrimaryBadge />}

      <div className="flex justify-between items-start mb-8">
        <BankIcon isPrimary={account.isPrimary} />
        <BankAccountCardActions
          account={account}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-foreground text-xl truncate">
          {account.bankName}
        </h3>
        <MetaLabel className="block">
          {account.accountName}
        </MetaLabel>
      </div>

      <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
        <div>
          <MetaLabel className="block mb-1">
            Account Number
          </MetaLabel>
          <p className="font-semibold text-foreground text-lg tracking-tighter">
            {account.accountNumber}
          </p>
        </div>
        {!account.isPrimary && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMakePrimary(account)}
            className="text-xs font-medium text-primary-ink hover:bg-primary/5"
          >
            Make Primary
          </Button>
        )}
      </div>
    </Card>
  );
}

function PrimaryBadge() {
  return (
    <div className="absolute top-0 right-0 px-6 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-bl-3xl">
      Primary
    </div>
  );
}

function BankIcon({ isPrimary }: { isPrimary: boolean }) {
  return (
    <div
      className={cn(
        "w-14 h-14 rounded-lg flex items-center justify-center",
        isPrimary
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      <AppIcon icon="solar:buildings-3-linear" className="w-7 h-7" />
    </div>
  );
}

function BankAccountCardActions({
  account,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  account: AdminBankAccount;
  onEdit: (account: AdminBankAccount) => void;
  onToggleActive: (account: AdminBankAccount) => void;
  onDelete: (account: AdminBankAccount) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(account)}
        className="rounded-lg hover:bg-muted hover:text-primary-ink"
      >
        <AppIcon icon="solar:pen-2-linear" className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onToggleActive(account)}
        className={cn(
          "rounded-lg",
          account.isActive
            ? "text-success-ink hover:text-success-ink/80"
            : "text-muted-foreground/60 hover:text-muted-foreground",
        )}
      >
        <AppIcon icon="solar:power-linear" className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(account)}
        className="rounded-lg text-destructive-ink hover:text-destructive-ink/80 hover:bg-destructive/10"
      >
        <AppIcon icon="solar:trash-bin-trash-linear" className="w-4 h-4" />
      </Button>
    </div>
  );
}
