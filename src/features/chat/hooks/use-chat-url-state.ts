"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { STAFF_ROOM_ID, useChatStore } from "../store/chat.store";
import type { ConversationTab } from "../types/chat";

/**
 * URL state for the chat workspace (ADR-0005): the open conversation (`?c=`)
 * and list tab (`?tab=`) live in the URL — deep-linkable, reload-safe and
 * back/forward-aware. The zustand store keeps a mirror because socket handlers
 * need synchronous access (`getState()`) outside React; this hook is the only
 * writer that keeps the two in step.
 *
 * Commits use the native History API like the other filter hooks
 * (use-product-filters.ts): Next syncs `useSearchParams` with pushState, the
 * change is synchronous, and no RSC navigation fires.
 */

/** URL value for the staff room — the store sentinel isn't URL-friendly. */
const STAFF_ROOM_SLUG = "staff-room";

const TABS: readonly ConversationTab[] = ["all", "mine", "queue"];

function idFromUrl(value: string | null): string | null {
  if (!value) return null;
  return value === STAFF_ROOM_SLUG ? STAFF_ROOM_ID : value;
}

function idToUrl(id: string | null): string | null {
  if (!id) return null;
  return id === STAFF_ROOM_ID ? STAFF_ROOM_SLUG : id;
}

export function useChatUrlState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSelectedId = idFromUrl(searchParams.get("c"));
  const tabParam = searchParams.get("tab") as ConversationTab | null;
  const urlTab: ConversationTab =
    tabParam && TABS.includes(tabParam) ? tabParam : "all";

  // URL → store: covers the initial load (deep link) and back/forward.
  useEffect(() => {
    const store = useChatStore.getState();
    if (store.selectedId !== urlSelectedId) store.select(urlSelectedId);
    if (store.activeTab !== urlTab) store.setTab(urlTab);
  }, [urlSelectedId, urlTab]);

  /** Store → URL: push a new entry (selecting is a deliberate action). */
  const commit = useCallback(
    (selectedId: string | null, tab: ConversationTab) => {
      const sp = new URLSearchParams(searchParams.toString());
      const c = idToUrl(selectedId);
      if (c) sp.set("c", c);
      else sp.delete("c");
      if (tab !== "all") sp.set("tab", tab);
      else sp.delete("tab");
      const qs = sp.toString();
      window.history.pushState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, searchParams],
  );

  return { commit };
}
