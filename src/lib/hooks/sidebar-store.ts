import { create } from "zustand";

/**
 * Cross-feature sidebar UI state. This is the documented zustand exception under
 * ADR-0005 — genuinely ephemeral layout UI state, not list/filter state (which
 * stays in the URL). Lives in `lib/hooks` because the layout chrome
 * (`components/ui/sidebar.tsx`) is cross-feature.
 *
 * Per ADR-0010 the sidebar is an on-demand overlay drawer on every viewport
 * (the same `Sheet` that used to be mobile-only), **closed by default**. There
 * is no desktop icon-rail anymore, so a single `open` flag drives the drawer on
 * both desktop and mobile — no separate `openMobile`. `isMobile` is kept only to
 * pick the drawer width. `state` is the derived expanded/collapsed label kept in
 * sync with `open`, mirroring the stock shadcn sidebar context this replaces
 * (still read by `SidebarMenuButton`'s tooltip).
 */
interface SidebarStore {
  open: boolean;
  isMobile: boolean;
  state: "expanded" | "collapsed";
  setOpen: (open: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  toggleSidebar: () => void;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  open: false,
  isMobile: false,
  state: "collapsed",
  setOpen: (open) => set({ open, state: open ? "expanded" : "collapsed" }),
  setIsMobile: (isMobile) => set({ isMobile }),
  toggleSidebar: () => {
    const next = !get().open;
    set({ open: next, state: next ? "expanded" : "collapsed" });
  },
}));
