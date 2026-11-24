"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";

import { useDeleteFxStandingLink, useFxStandingLinks } from "../api/fx.queries";
import type { FxStandingLink } from "../types/fx";
import { APPLIES_TO_LABELS, scopeLabel } from "../utils/fx-format";

/**
 * Saved scopes whose new products and parts start linked
 * (`GET /pricing/fx/standing-links`, `products:read`). Delete is SUPER_ADMIN
 * only, so `canDelete` hides it for everyone else.
 */
export function FxStandingLinks({ canDelete }: { canDelete: boolean }) {
  const { data: links = [], isLoading, isError } = useFxStandingLinks();
  const remove = useDeleteFxStandingLink();
  const [pending, setPending] = useState<FxStandingLink | null>(null);

  function confirmDelete() {
    if (!pending) return;
    remove.mutate(pending.id, {
      onSuccess: () => {
        toast.success("Standing link removed. Linked items stay linked.");
        setPending(null);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "The standing link was not removed."),
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold text-foreground">Standing links</h2>
          <p className="text-sm text-muted-foreground">
            New items added to these scopes start linked. Deleting a standing
            link does not unlink the items that are already linked.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            The standing links are not available right now.
          </p>
        ) : links.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No standing links. New items start unlinked.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {links.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-foreground">{scopeLabel(link)}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="muted">{APPLIES_TO_LABELS[link.appliesTo] ?? link.appliesTo}</Badge>
                    <span>
                      Saved{" "}
                      {new Date(link.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPending(link)}
                    className="text-destructive-ink hover:text-destructive-ink"
                  >
                    <AppIcon icon="solar:trash-bin-trash-linear" className="mr-1.5 size-4" />
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <ConfirmModal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={confirmDelete}
        isPending={remove.isPending}
        variant="destructive"
        title="Delete this standing link?"
        description={`New items in ${pending ? scopeLabel(pending) : "this scope"} will start unlinked. Items that are linked now stay linked. To unlink them, use "Stop following the dollar" in the link tool.`}
        confirmText="Delete standing link"
      />
    </Card>
  );
}
