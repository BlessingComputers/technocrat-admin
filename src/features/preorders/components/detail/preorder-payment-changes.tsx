"use client";

import { Card } from "@/components/ui/card";
import { usePermissions } from "@/lib/auth/use-permissions";
import { PREORDER_PERMISSIONS } from "../../constants/preorder-permissions";
import { usePreorderPaymentHistory } from "../../api/preorder.queries";
import type { Preorder } from "../../types/preorders";
import { canExtendPayment, canRevisePayment } from "../../utils/payment-changes";
import { PreorderPriceRevisionForm } from "./preorder-price-revision-form";
import { PreorderDeadlineForm } from "./preorder-deadline-form";

export function PreorderPaymentChanges({ preorder }: { preorder: Preorder }) {
  const { can } = usePermissions();
  const history = usePreorderPaymentHistory(preorder.id);
  const summary = preorder.paymentSummary;
  if (!summary || preorder.status !== "CONFIRMED") return null;
  const payment = summary.firstPayment;
  const savedRequest = history.data?.find((request) => request.id === payment.id);
  const allowRevision = can(PREORDER_PERMISSIONS.revisePrice) && savedRequest && canRevisePayment(savedRequest) && payment.status === "PENDING" && !history.isFetching && !history.isError;
  const allowExtension = can(PREORDER_PERMISSIONS.issueTerms) && canExtendPayment(payment);
  if (!allowRevision && !allowExtension) return null;

  return (
    <Card className="space-y-6 p-8">
      <h2 className="text-xl font-semibold">Change payment terms</h2>
      {allowRevision && <details><summary className="cursor-pointer font-medium">Revise price</summary><div className="pt-4"><PreorderPriceRevisionForm key={payment.id} preorderId={preorder.id} summary={summary} /></div></details>}
      {allowExtension && <details><summary className="cursor-pointer font-medium">Extend deadline</summary><div className="pt-4"><PreorderDeadlineForm key={`${payment.id}-${payment.payBy}`} preorderId={preorder.id} payment={payment} /></div></details>}
    </Card>
  );
}
