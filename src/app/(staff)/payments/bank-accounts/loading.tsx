import { PageHeader } from "@/components/shared/page-header";
import { BankAccountsGridSkeleton } from "@/features/orders";

export default function BankAccountsLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Accounts"
        description="Manage company accounts for customer payments"
      />
      <BankAccountsGridSkeleton />
    </div>
  );
}
