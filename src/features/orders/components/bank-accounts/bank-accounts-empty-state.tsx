import { AppIcon } from "@/components/shared/app-icon";

/** Shown on the bank-accounts page when no accounts have been created yet. */
export function BankAccountsEmptyState() {
  return (
    <div className="col-span-full py-20 text-center bg-card rounded-lg border-none">
      <AppIcon
        icon="solar:buildings-3-linear"
        className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
      />
      <h3 className="text-xl font-black text-foreground">No accounts found</h3>
      <p className="text-muted-foreground font-medium">
        Add a company bank account to get started
      </p>
    </div>
  );
}
