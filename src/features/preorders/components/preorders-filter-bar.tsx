"use client";

import { Button } from "@/components/ui/button";
import { FilterBar, FilterSearch } from "@/components/shared/filter-bar";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";

interface PreordersFilterBarProps {
  searchInput: string;
  hasActiveFilters: boolean;
  onSearch: (value: string) => void;
  onReset: () => void;
}

/**
 * Search only. The status filter lives in `PreordersStatusChips` above, so the
 * usual status `<Select>` would be a second control for the same field.
 */
export function PreordersFilterBar({
  searchInput,
  hasActiveFilters,
  onSearch,
  onReset,
}: PreordersFilterBarProps) {
  return (
    <FilterBar>
      <FilterSearch
        placeholder="Search reference, name, email, product or brand..."
        value={searchInput}
        onChange={(e) => onSearch(e.target.value)}
      />

      {hasActiveFilters && (
        <Button variant="outline" onClick={onReset} className="gap-2">
          <AppIcon
            icon="solar:restart-linear"
            className="w-4 h-4 text-muted-foreground"
          />
          <MetaLabel>Reset</MetaLabel>
        </Button>
      )}
    </FilterBar>
  );
}
