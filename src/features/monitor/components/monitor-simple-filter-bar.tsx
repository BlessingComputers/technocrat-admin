"use client";

import { useState } from "react";
import { FilterSearch } from "@/components/shared/filter-bar";
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
    <FilterSearch
      wrapperClassName="max-w-md"
      placeholder={placeholder}
      value={pathDraft}
      onChange={(e) => setPathDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
    />
  );
}
