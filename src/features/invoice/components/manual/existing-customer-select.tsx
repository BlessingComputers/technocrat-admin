"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/shared/app-icon";
import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

/**
 * Minimal customer row for the "link to existing customer" picker. This slice
 * can't import the customers feature (ARCHITECTURE.md rule 2), so it queries the
 * shared admin-customers endpoint directly for just the fields it needs.
 */
export interface ExistingCustomerOption {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

function extractCustomers(raw: unknown): ExistingCustomerOption[] {
  const root = (raw ?? {}) as Record<string, unknown>;
  const payload = "data" in root ? root.data : root;
  if (Array.isArray(payload)) return payload as ExistingCustomerOption[];
  const obj = (payload ?? {}) as Record<string, unknown>;
  // The admin-customers endpoint nests the array at `data.data`, so `obj.data`
  // must be in the fallback chain (mirrors the customers-list normalizer).
  const list = obj.customers ?? obj.items ?? obj.results ?? obj.data;
  return Array.isArray(list) ? (list as ExistingCustomerOption[]) : [];
}

interface ExistingCustomerSelectProps {
  selectedLabel: string;
  selectedEmail?: string;
  onSelect: (customer: ExistingCustomerOption) => void;
  onClear: () => void;
}

export function ExistingCustomerSelect({
  selectedLabel,
  selectedEmail,
  onSelect,
  onClear,
}: ExistingCustomerSelectProps) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the input into the query term so we don't fetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(
    () => () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    [],
  );

  const { data, isFetching } = useQuery({
    queryKey: ["invoice", "manual", "customer-search", search],
    queryFn: () =>
      api.get<unknown>(API_ENDPOINTS.customerMgt.base, {
        params: { search, limit: 8 },
        raw: true,
      }),
    enabled: search.length >= 2,
    staleTime: 1000 * 30,
  });

  const results = extractCustomers(data);
  const showResults = focused && search.length >= 2;

  // When a customer is linked, show a compact selected card instead of the input.
  if (selectedLabel) {
    return (
      <div className="space-y-2">
        <FieldLabel />
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <AppIcon
            icon="solar:user-check-linear"
            className="h-5 w-5 shrink-0 text-primary"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {selectedLabel}
            </p>
            {selectedEmail && (
              <p className="truncate text-[11px] font-medium text-muted-foreground">
                {selectedEmail}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onClear();
              setInput("");
            }}
            className="ml-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FieldLabel />
      <div className="relative">
        <AppIcon
          icon="solar:magnifer-linear"
          className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground"
        />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Delay so a result's click registers before the list unmounts.
            blurTimer.current = setTimeout(() => setFocused(false), 150);
          }}
          placeholder="Search by email or name…"
          className="h-11 rounded-lg bg-muted/50 border-border pl-11 font-bold"
        />

        {showResults && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-soft-lg">
            {isFetching ? (
              <p className="py-6 text-center text-xs font-medium text-muted-foreground">
                Searching…
              </p>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-xs font-medium text-muted-foreground">
                No customers match “{search}”
              </p>
            ) : (
              results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  // mouseDown fires before the input's blur, so selection sticks.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(customer);
                    setInput("");
                    setFocused(false);
                  }}
                  className="flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span className="text-sm font-bold text-foreground">
                    {`${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() ||
                      "Unnamed"}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {customer.email}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldLabel() {
  return (
    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
      Link to existing customer{" "}
      <span className="text-muted-foreground/60">(optional)</span>
    </Label>
  );
}
