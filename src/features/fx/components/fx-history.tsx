"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataPagination } from "@/components/shared/data-pagination";

import { useFxHistory } from "../api/fx.queries";
import { formatChange, formatRate, logDetail, statusMeta } from "../utils/fx-format";

const LIMIT = 20;

/**
 * Every FX decision, newest first (`GET /pricing/fx/history`). `RECORDED`
 * rows are scheduled checks while auto-update is off: nothing was repriced,
 * and the row says what the rules would have done.
 */
export function FxHistory() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useFxHistory(page);
  const logs = data?.data ?? [];

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold text-foreground">History</h2>
          <p className="text-sm text-muted-foreground">
            Each rate check and price change. The rate is the pricing rate:
            the official rate plus the gap.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">The history is not available right now.</p>
        ) : logs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No rate checks yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {logs.map((log) => {
              const status = statusMeta(log.status);
              const detail = logDetail(log);
              return (
                <li key={log.id} className="space-y-1 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Badge variant={status.tone}>{status.label}</Badge>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatRate(log.rateUsdNgn)}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatChange(log.rateChangePercent)}
                    </span>
                    {log.variantsUpdated > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {log.variantsUpdated.toLocaleString("en-GB")} prices changed
                      </span>
                    )}
                    <time
                      dateTime={log.triggeredAt}
                      className="ml-auto text-xs tabular-nums text-muted-foreground"
                    >
                      {new Date(log.triggeredAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
                </li>
              );
            })}
          </ul>
        )}

        {data && data.meta.totalPages > 1 && (
          <DataPagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={LIMIT}
            onPageChange={setPage}
            noun="entries"
          />
        )}
      </CardContent>
    </Card>
  );
}
