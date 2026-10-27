"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { cn } from "@/lib/utils/cn";
import { getErrorMessage } from "@/lib/api/error-message";
import { usePermissions } from "@/lib/auth/use-permissions";
import { PREORDER_PERMISSIONS } from "../constants/preorder-permissions";
import { useUpdatePreorderStatus } from "../api/preorder.queries";
import {
  PREORDER_STATUSES,
  type Preorder,
  type PreorderStatus,
} from "../types/preorders";
import {
  advanceLabel,
  needsConfirmation,
  nextStatus,
  preorderStatusLabel,
} from "../utils/preorder-utils";

interface PreorderStatusActionsProps {
  preorder: Preorder;
  /** `sm` for a table row, `default` for the detail page header. */
  size?: "sm" | "default";
  className?: string;
}

/**
 * Moves one pre-order along its lifecycle.
 *
 * Shape of the control, and why: the forward step is a plain button, and
 * everything else is behind a menu. A five-way `<Select>` was the obvious
 * build and it is the wrong one — it presents "cancel this" and "the thing you
 * do fifty times a day" as equally weighted options, and makes the common case
 * cost a click plus a read. Here the common case is one click, corrections
 * stay one click deeper, and nothing becomes unreachable.
 *
 * Confirmation is applied by consequence, not uniformly: cancelling, closing
 * as fulfilled, and reopening a closed row all stop for a dialog; the routine
 * nudges don't (see `needsConfirmation`).
 */
export function PreorderStatusActions({
  preorder,
  size = "sm",
  className,
}: PreorderStatusActionsProps) {
  const { mutateAsync, isPending } = useUpdatePreorderStatus();
  const { can } = usePermissions();
  const [confirming, setConfirming] = useState<PreorderStatus | null>(null);

  const current = preorder.status;
  // CONTACTED can only become CONFIRMED through the atomic payment-terms
  // endpoint. A plain status update would confirm the preorder without opening
  // the payment request or notifying the customer.
  const next = current === "CONTACTED" ? null : nextStatus(current);
  const advance = next === "FULFILLED" || next === "CANCELLED" ? null : next;
  const advanceText = advanceLabel(current);

  const apply = (status: PreorderStatus) => {
    if (status === "FULFILLED" || status === "CANCELLED") return;
    const promise = mutateAsync({ id: preorder.id, status });

    toast.promise(promise, {
      loading: `Moving to ${preorderStatusLabel(status).toLowerCase()}…`,
      success: `${preorder.preorderId} is now ${preorderStatusLabel(status).toLowerCase()}.`,
      error: (err) =>
        getErrorMessage(err, "Could not update this pre-order's status."),
    });

    // `toast.promise` already surfaces the failure; swallow the rejection so it
    // doesn't also escape as an unhandled promise.
    promise.then(() => setConfirming(null)).catch(() => setConfirming(null));
  };

  const request = (status: PreorderStatus) => {
    if (needsConfirmation(current, status)) setConfirming(status);
    else apply(status);
  };

  // Every status except the one it already has. Backwards moves included: the
  // backend permits them and a mis-click that can't be undone is worse than a
  // menu with an unusual option in it.
  const otherStatuses = PREORDER_STATUSES.filter(
    (status) =>
      status !== current && status !== "FULFILLED" && status !== "CANCELLED" &&
      !(current === "CONTACTED" && status === "CONFIRMED"),
  );

  // Terminal records stay closed until the backend can safely reconcile their
  // payments and cancellation resolutions when reopening.
  if (!can(PREORDER_PERMISSIONS.issueTerms)) return null;
  if ((current === "CANCELLED" || current === "FULFILLED") && preorder.paymentSummary !== null) return null;

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {advance && advanceText && (
          <Button
            size={size}
            onClick={() => request(advance)}
            disabled={isPending}
            className="gap-2 font-medium"
          >
            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
            {advanceText}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={size}
              disabled={isPending}
              className="gap-2 font-medium"
              // Without the advance button beside it this menu IS the control,
              // so it says what it does rather than showing a bare chevron.
              aria-label={`Change status of ${preorder.preorderId}`}
            >
              {!advance && <span>Change status</span>}
              <AppIcon
                icon="solar:alt-arrow-down-linear"
                className="size-3.5 text-muted-foreground"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            {otherStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => request(status)}
                className={cn(
                  "cursor-pointer text-xs font-medium",
                  status === "CANCELLED" && "text-destructive-ink",
                )}
              >
                Mark {preorderStatusLabel(status).toLowerCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmModal
        isOpen={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => confirming && apply(confirming)}
        isPending={isPending}
        variant={confirming === "CANCELLED" ? "destructive" : "primary"}
        title={
          confirming
            ? `Mark ${preorder.preorderId} as ${preorderStatusLabel(confirming).toLowerCase()}?`
            : ""
        }
        description={confirming ? confirmationCopy(current, confirming) : ""}
        confirmText={
          confirming ? `Mark ${preorderStatusLabel(confirming).toLowerCase()}` : "Confirm"
        }
      />
    </>
  );
}

/**
 * What the customer will actually experience, rather than a restatement of the
 * button. The editability line is the one worth spelling out: past `CONTACTED`
 * the backend starts rejecting the customer's own `PATCH` with a 409, so
 * confirming here quietly takes the pre-order out of their hands.
 */
function confirmationCopy(from: PreorderStatus, to: PreorderStatus): string {
  if (to === "CANCELLED") {
    return "The pre-order closes and stops appearing as open work. The customer keeps the record and can place a new pre-order at any time.";
  }
  if (to === "FULFILLED") {
    return "This closes the pre-order as delivered. Only do this once the customer actually has the item.";
  }
  // Reopening: `from` is terminal, since `needsConfirmation` sent us here.
  return `This pre-order is currently ${preorderStatusLabel(from).toLowerCase()}. Reopening it puts it back into the queue as open work.`;
}
