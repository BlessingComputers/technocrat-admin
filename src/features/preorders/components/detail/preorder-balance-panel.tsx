"use client";

import { Card } from "@/components/ui/card";
import { usePermissions } from "@/lib/auth/use-permissions";
import { PREORDER_PERMISSIONS } from "../../constants/preorder-permissions";
import type { Preorder } from "../../types/preorders";
import { canRequestBalance } from "../../utils/balance-payment";
import { PreorderBalanceRequestForm } from "./preorder-balance-request-form";
import { PreorderBalanceSummary } from "./preorder-balance-summary";

export function PreorderBalancePanel({ preorder }: { preorder: Preorder }) {
  const { can } = usePermissions();
  const summary = preorder.paymentSummary;
  if (!summary || summary.plan === "FULL_PAYMENT") return null;
  const balance = summary.balancePayment;
  const canRequest = can(PREORDER_PERMISSIONS.issueTerms) && canRequestBalance(preorder.status, summary);
  if (!balance && !canRequest) return null;

  return (
    <Card className="space-y-5 p-8">
      <h2 className="text-xl font-semibold">Remaining balance</h2>
      {balance
        ? <PreorderBalanceSummary payment={balance} editable={preorder.status === "CONFIRMED"} />
        : <PreorderBalanceRequestForm preorderId={preorder.id} amount={summary.amountDue} />}
    </Card>
  );
}
