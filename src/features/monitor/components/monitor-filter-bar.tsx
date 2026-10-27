"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterBar, FilterSearch } from "@/components/shared/filter-bar";
import type { MonitorRequestsParams } from "../types/monitor";

interface MonitorFilterBarProps {
  params: MonitorRequestsParams;
  onParamsChange: (params: MonitorRequestsParams) => void;
}

const TAG_OPTIONS = [
  "5xx",
  "4xx",
  "slow",
  "authenticated",
  "ai",
  "webhook",
  "payment",
  "auth",
  "system",
  "critical",
];

/**
 * Full filter bar for `/security` (the raw `GET /monitor/requests` endpoint) —
 * `/errors` and `/slow` are pre-filtered server-side shortcuts and don't get
 * this (see MonitorErrorsOrSlowParams).
 */
export function MonitorFilterBar({
  params,
  onParamsChange,
}: MonitorFilterBarProps) {
  // Local draft state for the free-text fields so every keystroke doesn't
  // refetch — committed on blur/Enter, mirroring the app's other filter bars'
  // instant-select but debounced-text convention.
  const [pathDraft, setPathDraft] = useState(params.path ?? "");

  const commitPath = () =>
    onParamsChange({ ...params, path: pathDraft || undefined });

  return (
    <div className="space-y-3">
      <FilterBar>
        <FilterSearch
          placeholder="Filter by path (e.g. /api/v1/orders)..."
          value={pathDraft}
          onChange={(e) => setPathDraft(e.target.value)}
          onBlur={commitPath}
          onKeyDown={(e) => e.key === "Enter" && commitPath()}
        />

        <Input
          placeholder="Method (GET, POST...)"
          className="sm:w-40"
          value={params.method ?? ""}
          onChange={(e) =>
            onParamsChange({
              ...params,
              method: e.target.value.toUpperCase() || undefined,
            })
          }
        />

        <Input
          placeholder="Min duration (ms)"
          type="number"
          className="sm:w-44"
          value={params.minDuration ?? ""}
          onChange={(e) =>
            onParamsChange({
              ...params,
              minDuration: e.target.value || undefined,
            })
          }
        />
      </FilterBar>

      <div className="flex flex-wrap gap-2">
        {TAG_OPTIONS.map((tag) => {
          const active = params.tag === tag;
          return (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className="rounded-full h-7 px-3 text-xs"
              onClick={() =>
                onParamsChange({ ...params, tag: active ? undefined : tag })
              }
            >
              {tag}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
