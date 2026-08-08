"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <AppIcon
            icon="solar:magnifer-linear"
            className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors"
          />
          <Input
            placeholder="Filter by path (e.g. /api/v1/orders)..."
            className="pl-12 h-12 rounded-md border border-border bg-card focus:ring-primary/20 font-medium"
            value={pathDraft}
            onChange={(e) => setPathDraft(e.target.value)}
            onBlur={commitPath}
            onKeyDown={(e) => e.key === "Enter" && commitPath()}
          />
        </div>

        <Input
          placeholder="Method (GET, POST...)"
          className="h-12 md:w-40 rounded-md border border-border bg-card font-medium"
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
          className="h-12 md:w-44 rounded-md border border-border bg-card font-medium"
          value={params.minDuration ?? ""}
          onChange={(e) =>
            onParamsChange({
              ...params,
              minDuration: e.target.value || undefined,
            })
          }
        />
      </div>

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
