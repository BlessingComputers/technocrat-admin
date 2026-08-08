"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Table row selection by id (for bulk actions). Feature-agnostic — lives in
 * `lib/hooks` because both the products and parts lists use it.
 *
 * Selection is intentionally NOT auto-pruned when the visible rows change
 * (page/filter): the caller decides when to clear (e.g. after a bulk action
 * succeeds). `toggleAll` operates on the ids the caller passes — typically the
 * current page — so it unions/among them rather than clobbering off-page picks.
 */
export function useRowSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMany = useCallback((ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const ids = useMemo(() => Array.from(selected), [selected]);

  return { selected, ids, count: selected.size, toggle, toggleMany, clear };
}
