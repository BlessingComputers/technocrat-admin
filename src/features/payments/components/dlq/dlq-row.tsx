"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dlqJobTypeTone } from "../../utils/payment-utils";
import { useReplayDlqEntry } from "../../api/payments.queries";
import type { DlqEntry } from "../../types/payments";

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export function DlqRow({ entry }: { entry: DlqEntry }) {
  const replay = useReplayDlqEntry();
  const { data } = entry;

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-8 py-4">
        <Badge variant={dlqJobTypeTone(data.type)}>
          {data.type}
        </Badge>
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(data.failedAt).toLocaleString(undefined, DATE_OPTS)}
        </div>
      </td>
      <td className="px-8 py-4">
        {data.paymentId ? (
          // Not a link: this is the human PMT-XXXX id, and the payment
          // detail route resolves by DB UUID. The DLQ entry doesn't carry
          // that UUID, so there's nothing safe to deep-link to here.
          <span className="font-semibold text-sm text-foreground">
            {data.paymentId}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            No matched payment
          </span>
        )}
        {data.reference && (
          <div className="text-xs text-muted-foreground font-mono">
            {data.reference}
          </div>
        )}
      </td>
      <td className="px-8 py-4 max-w-xs">
        <p className="text-xs text-foreground line-clamp-2">
          {data.failedReason}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {data.attemptsMade} attempts
        </p>
      </td>
      <td className="px-8 py-4 text-right">
        <Button
          variant="outline"
          size="sm"
          disabled={replay.isPending}
          onClick={() => replay.mutate(entry.id)}
          className="rounded-lg font-medium text-xs"
        >
          <AppIcon icon="solar:refresh-circle-linear" className="w-3.5 h-3.5 mr-1.5" />
          {replay.isPending ? "Replaying..." : "Replay"}
        </Button>
      </td>
    </tr>
  );
}
