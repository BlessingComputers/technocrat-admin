import * as React from "react";

/**
 * Subscribe to a CSS media query. Uses `useSyncExternalStore` (the
 * React-recommended external-store pattern, avoiding setState-in-effect). SSR
 * snapshot is `false` (desktop-first), matching `use-mobile.ts`.
 *
 * Prefer this over `useIsMobile` when the JS breakpoint must line up with a
 * Tailwind CSS breakpoint — e.g. `useMediaQuery("(max-width: 1023px)")` is
 * "below `lg`", so JS and `lg:` classes agree instead of splitting at 768px.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [query],
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
