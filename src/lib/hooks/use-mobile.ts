import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * True when the viewport is below the mobile breakpoint. Subscribes to
 * `matchMedia` via `useSyncExternalStore` — the React-recommended pattern for
 * external stores, which avoids calling setState inside an effect. SSR snapshot
 * is `false` (desktop-first). Lives in `lib/hooks` (cross-feature).
 */
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
