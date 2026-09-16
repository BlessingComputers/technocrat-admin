"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { PreorderStatusBadge } from "../preorder-status-badge";
import { PreorderStatusActions } from "../preorder-status-actions";
import {
  formatAge,
  formatDateTime,
  isStale,
  preorderStatusHint,
} from "../../utils/preorder-utils";
import type { Preorder } from "../../types/preorders";

interface PreorderStatusPanelProps {
  preorder: Preorder;
}

/**
 * Where the pre-order stands and what to do about it.
 *
 * `updatedAt` is labelled "Last change" rather than presented as a history,
 * and there is deliberately no stepper. The backend keeps no transition log —
 * only the current status and the row's last write timestamp — so a timeline
 * with dates against each stage would be drawing events we cannot know. A
 * dateless stepper was the fallback idea and it is worse: `CANCELLED` is not a
 * point on the line from PENDING to FULFILLED, so a progress bar has to either
 * hide it or lie about where it sits.
 */
export function PreorderStatusPanel({ preorder }: PreorderStatusPanelProps) {
  const stale = isStale(preorder);

  return (
    <Card className="p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <MetaLabel>Status</MetaLabel>
          <PreorderStatusBadge
            status={preorder.status}
            className="px-3 py-1.5 text-sm"
          />
        </div>
        <PreorderStatusActions preorder={preorder} size="default" />
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {preorderStatusHint(preorder.status)}
      </p>

      {stale && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/25 bg-warning/10 p-4">
          <AppIcon
            icon="solar:clock-circle-bold"
            className="mt-0.5 w-4 h-4 shrink-0 text-warning"
          />
          <p className="text-xs font-medium leading-relaxed text-warning">
            Nobody has contacted this customer in {formatAge(preorder.createdAt)}.
            Response time is the whole product on a pre-order.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 border-t border-border pt-6">
        <div>
          <MetaLabel>Submitted</MetaLabel>
          <p className="mt-1 text-sm font-semibold tracking-tight text-foreground">
            {formatDateTime(preorder.createdAt)}
          </p>
        </div>
        <div>
          <MetaLabel>Last change</MetaLabel>
          <p className="mt-1 text-sm font-semibold tracking-tight text-foreground">
            {formatDateTime(preorder.updatedAt)}
          </p>
        </div>
      </div>
    </Card>
  );
}
