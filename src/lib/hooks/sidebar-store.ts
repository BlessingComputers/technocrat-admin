import { create } from "zustand";

/**
 * Cross-feature sidebar UI state. This is the documented zustand exception under
 * ADR-0005 — genuinely ephemeral layout UI state, not list/filter state (which
 * stays in the URL). Lives in `lib/hooks` because the layout chrome
 * (`components/ui/sidebar.tsx`) is cross-feature.
 *
 * Two independent axes, because the sidebar has two independent behaviours
 * (ADR-0016):
 *
 * - `open` — the **small-screen drawer** (below `lg`). Closed by default, opened
 *   from the topbar `☰`, dismissed by the backdrop. This is ADR-0010's behaviour,
 *   which still holds verbatim below `lg`. `isMobile` only picks the drawer width.
 *   `state` is the derived expanded/collapsed label kept in sync with `open`,
 *   mirroring the stock shadcn sidebar context this replaces (still read by
 *   `SidebarMenuButton`'s tooltip).
 * - `railCollapsed` — the **docked rail** at `lg`+, toggled by the chevron in the
 *   sidebar header. Collapsed means the 3rem icon rail, not hidden.
 *
 * Overloading `open` for both was tempting and wrong: the drawer defaults closed
 * and the rail defaults expanded, so one flag cannot serve both without the
 * desktop rail booting collapsed.
 *
 * `railCollapsed` is seeded from a cookie the server already read (see
 * `SIDEBAR_RAIL_COOKIE`), so the first paint is the persisted width — a
 * localStorage read in an effect would collapse the rail *after* hydration and
 * shove the whole canvas sideways on every load.
 */
interface SidebarStore {
  open: boolean;
  isMobile: boolean;
  state: "expanded" | "collapsed";
  railCollapsed: boolean;
  setOpen: (open: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  toggleSidebar: () => void;
  setRailCollapsed: (railCollapsed: boolean) => void;
  toggleRail: () => void;
}

/** Cookie the `(staff)` layout reads server-side to seed `railCollapsed`. */
export const SIDEBAR_RAIL_COOKIE = "sidebar_rail";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function persistRail(collapsed: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `${SIDEBAR_RAIL_COOKIE}=${collapsed ? "collapsed" : "expanded"}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  open: false,
  isMobile: false,
  state: "collapsed",
  railCollapsed: false,
  setOpen: (open) => set({ open, state: open ? "expanded" : "collapsed" }),
  setIsMobile: (isMobile) => set({ isMobile }),
  toggleSidebar: () => {
    const next = !get().open;
    set({ open: next, state: next ? "expanded" : "collapsed" });
  },
  setRailCollapsed: (railCollapsed) => set({ railCollapsed }),
  toggleRail: () => {
    const next = !get().railCollapsed;
    persistRail(next);
    set({ railCollapsed: next });
  },
}));
