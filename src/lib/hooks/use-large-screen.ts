import * as React from "react";

const LARGE_BREAKPOINT = 1024; // Tailwind `lg`

/**
 * True when the viewport is at or above the `lg` breakpoint — the width at which
 * the sidebar docks as a persistent rail instead of an on-demand drawer. Uses
 * `useSyncExternalStore` (same pattern as `useIsMobile`). The SSR snapshot is
 * `true` (desktop-first) so the server renders the docked rail, not the drawer,
 * avoiding a hydration flash on desktop.
 */
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(min-width: ${LARGE_BREAKPOINT}px)`);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.innerWidth >= LARGE_BREAKPOINT;
}

function getServerSnapshot() {
  return true;
}

export function useIsLargeScreen() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
