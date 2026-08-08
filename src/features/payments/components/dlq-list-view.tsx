"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDlq } from "../api/payments.queries";
import { PaymentsAccessGate } from "./payments-access-gate";
import { PaymentsNavTabs } from "./payments-nav-tabs";
import { PaymentsPagination } from "./payments-pagination";
import { DlqTable } from "./dlq/dlq-table";
import type { DlqListParams } from "../types/payments";

const DEFAULT_PARAMS: DlqListParams = { page: 1, limit: 20, type: "" };

/**
 * Dead letter queue (route `/payments/dlq`) — jobs that threw and exhausted
 * every retry, NOT every stuck payment (PAYMENTS-BACKEND-CONTRACT.md §3;
 * the reconciliation-sweep outcome lives on the payment detail page instead).
 */
export function DlqListView() {
  const [params, setParams] = useState<DlqListParams>(DEFAULT_PARAMS);
  const { entries, meta, isLoading, isError, isFetching, refetch } =
    useDlq(params);

  return (
    <PaymentsAccessGate>
      <div className="space-y-8">
        <PageHeader
          title="Dead Letter Queue"
          description="Payment-events jobs that threw and exhausted every retry — replay once the underlying issue is fixed"
        >
          <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        </PageHeader>

        <PaymentsNavTabs />

        <Select
          value={params.type || "ALL"}
          onValueChange={(val) =>
            setParams({
              ...params,
              page: 1,
              type: val === "ALL" ? "" : (val as DlqListParams["type"]),
            })
          }
        >
          <SelectTrigger className="h-12! data-[size=default]:h-12 px-6 rounded-md border border-border bg-card text-xs font-medium text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/20 min-w-[180px]">
            <SelectValue placeholder="All Job Types" />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border text-xs font-medium text-foreground">
            <SelectItem value="ALL">All Job Types</SelectItem>
            <SelectItem value="VERIFY">Verify</SelectItem>
            <SelectItem value="WEBHOOK">Webhook</SelectItem>
            <SelectItem value="NOTIFY">Notify</SelectItem>
          </SelectContent>
        </Select>

        <DlqTable
          entries={entries}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
        />

        {meta && meta.totalPages > 1 && (
          <PaymentsPagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(p) => setParams({ ...params, page: p })}
          />
        )}
      </div>
    </PaymentsAccessGate>
  );
}
