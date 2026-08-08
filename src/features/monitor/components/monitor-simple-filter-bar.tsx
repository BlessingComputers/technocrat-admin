"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/shared/app-icon";
import type { MonitorErrorsOrSlowParams } from "../types/monitor";

interface MonitorSimpleFilterBarProps {
  params: MonitorErrorsOrSlowParams;
  onParamsChange: (params: MonitorErrorsOrSlowParams) => void;
  placeholder?: string;
}

/** Path-only filter for `/monitor/errors` and `/monitor/slow` — those
 * endpoints are pre-filtered server-side shortcuts, so only `path` applies. */
export function MonitorSimpleFilterBar({
  params,
  onParamsChange,
  placeholder = "Filter by path (e.g. /api/v1/orders)...",
}: MonitorSimpleFilterBarProps) {
  const [pathDraft, setPathDraft] = useState(params.path ?? "");

  const commit = () => onParamsChange({ ...params, path: pathDraft || undefined });

  return (
    <div className="relative max-w-md group">
      <AppIcon
        icon="solar:magnifer-linear"
        className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors"
      />
      <Input
        placeholder={placeholder}
        className="pl-12 h-12 rounded-md border border-border bg-card focus:ring-primary/20 font-medium"
        value={pathDraft}
        onChange={(e) => setPathDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
    </div>
  );
}
