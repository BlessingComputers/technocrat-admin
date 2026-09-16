"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils/cn";
import {
  filterNavByPermissions,
  isSuperAdmin,
  type StaffSession,
} from "@/lib/auth/permissions";
import type { NavGroup, NavItem } from "@/types/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRailTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";
import { AppIcon } from "@/components/shared/app-icon";
import { LogoutConfirmModal } from "@/components/shared/logout-confirm-modal";
import { logoutAction } from "@/lib/auth/logout-action";
import { disconnectChatSocket } from "@/features/chat";

/**
 * Renders `children` either as the account menu's trigger or as plain content.
 * Exists so the collapsed rail's avatar can pick up the menu the gear normally
 * owns, without duplicating the avatar markup in two branches.
 */
function ConditionalDropdownTrigger({
  asTrigger,
  children,
}: {
  asTrigger: boolean;
  children: React.ReactElement;
}) {
  if (!asTrigger) return children;

  return (
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label="Account and settings"
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </button>
    </DropdownMenuTrigger>
  );
}

interface AppSidebarProps {
  /** Raw nav config, injected by the (staff) layout (components can't import config). */
  navGroups: NavGroup[];
  staffSession?: StaffSession | null;
}

/**
 * Is `href` the route currently open? Compares against the path only —
 * `usePathname()` strips the query/hash, but hrefs may carry them (e.g.
 * `/catalogues?page=1`). `/` is matched exactly: every path starts with it, so
 * the prefix test would light up the dashboard row on every screen.
 */
function isPathActive(pathname: string, href: string): boolean {
  const hrefPath = href.split(/[?#]/)[0];
  if (hrefPath === "/") return pathname === "/";
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

/** Shared row geometry: the frame's full-bleed rows, padded by the row itself. */
const ROW_BASE =
  "group/nav h-11 rounded-none px-5 transition-colors duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0";
const ROW_IDLE =
  "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground";
const ROW_ACTIVE =
  "bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground";

/** A leaf row: one icon, one label, one route. */
function NavLeafRow({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={cn(ROW_BASE, isActive ? ROW_ACTIVE : ROW_IDLE)}
      >
        <Link
          href={item.href ?? "/"}
          className="flex w-full items-center gap-3"
        >
          <AppIcon
            icon={isActive ? item.iconActive : item.icon}
            // Inherits the row's colour rather than setting its own: on the
            // solid active fill the glyph must go white with the label, and any
            // `text-*` here would fight that.
            className="size-5 shrink-0"
          />
          {/* Body step (14px). The frame draws ~15px, which is off DESIGN.md's
              four-tier ramp; the ramp wins until ticket 07 rules on
              enforced-vs-aspirational. */}
          <span className="text-sm group-data-[collapsible=icon]:hidden">
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * A parent row and its child routes. The parent navigates nowhere — it opens the
 * list — so it never takes the solid active fill; the child does (two filled
 * rows would read as two selections). It opens on its own whenever a child is
 * the current route, and stays wherever the user last put it after that.
 *
 * Collapsed to the icon rail there is no room for a child list, and a parent
 * with no `href` would otherwise be a dead icon. Clicking it there expands the
 * rail and opens the list in one go, rather than sending the user somewhere they
 * did not ask for.
 */
function NavParentRow({
  item,
  pathname,
  isOpen,
  railCollapsed,
  onToggle,
  onExpandRail,
}: {
  item: NavItem;
  pathname: string;
  isOpen: boolean;
  railCollapsed: boolean;
  onToggle: () => void;
  onExpandRail: () => void;
}) {
  const children = item.children ?? [];
  const listId = `nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={railCollapsed ? onExpandRail : onToggle}
        aria-expanded={railCollapsed ? undefined : isOpen}
        aria-controls={railCollapsed ? undefined : listId}
        tooltip={item.title}
        className={cn(ROW_BASE, ROW_IDLE)}
      >
        <AppIcon icon={item.icon} className="size-5 shrink-0" />
        <span className="text-sm group-data-[collapsible=icon]:hidden">
          {item.title}
        </span>
        <AppIcon
          icon="solar:alt-arrow-down-linear"
          className={cn(
            "ml-auto size-4 shrink-0 transition-transform duration-200",
            "group-data-[collapsible=icon]:hidden",
            isOpen && "rotate-180",
          )}
        />
      </SidebarMenuButton>

      {isOpen && (
        <SidebarMenuSub
          id={listId}
          // Full-bleed like the rows above it: the primitive's inset margin and
          // hairline would pull the child rows off the frame's edge-to-edge grid.
          className="mx-0 gap-0 border-none px-0 py-0"
        >
          {children.map((child) => {
            const childActive = isPathActive(pathname, child.href ?? "");
            return (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={childActive}
                  className={cn(
                    // The primitive pins descendant svgs to the accent colour;
                    // `text-current` hands the glyph back to its row.
                    "h-10 translate-x-0 gap-3 rounded-none pl-[3.25rem] pr-5 [&>svg]:text-current",
                    childActive ? ROW_ACTIVE : ROW_IDLE,
                  )}
                >
                  <Link href={child.href ?? "/"}>
                    <AppIcon
                      icon={childActive ? child.iconActive : child.icon}
                      className="size-[18px] shrink-0"
                    />
                    <span className="text-sm">{child.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

/**
 * Named `AppSidebar` (not `Sidebar`) to avoid clashing with the `Sidebar`
 * primitive it imports from `components/ui/sidebar`. Icons are Iconify Solar
 * (linear inactive / bold active) rendered via `<AppIcon>` (ADR-0009), except
 * WhatsApp, which uses the real brand mark from the `brand:` collection. The
 * rail is docked on large screens and a drawer below `lg` (ADR-0010, revised),
 * and the header chevron collapses the docked rail to icons (ADR-0016).
 *
 * Chrome shape follows Figma `404:1729`. The one thing here that cannot be
 * value-swapped from Blessing is the **active row**: a solid, full-bleed
 * `sidebar-primary` rectangle with white text, square and edge-to-edge — where
 * Blessing uses an inset tinted pill with brand-coloured text. That is why the
 * nav list carries no horizontal padding and the rows carry it instead; padding
 * on the list would inset the fill and lose the effect.
 */
export function AppSidebar({ navGroups, staffSession = null }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { railCollapsed, toggleRail } = useSidebar();
  const [isLoggingOut, startLogout] = useTransition();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  // Parent rows the user has opened or closed by hand, keyed by title. Absent =
  // follow the route (open when a child is active).
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(
    {},
  );

  const handleLogout = () => {
    startLogout(async () => {
      try {
        const data = await logoutAction();
        toast.success(data?.message || "Logged out successfully");
        router.push("/login");
      } catch (error) {
        toast.error("Failed to log out");
        console.error("Logout failed", error);
      } finally {
        // Hang up the shared chat socket on logout regardless of where it fired
        // from — otherwise the socket keeps reconnecting in the background and
        // the staff member lingers as "online" until the presence TTL lapses.
        disconnectChatSocket();
        setIsLogoutModalOpen(false);
      }
    });
  };

  const filteredGroups = filterNavByPermissions(navGroups, staffSession);
  const superAdmin = isSuperAdmin(staffSession);

  const initials = staffSession
    ? `${staffSession.firstName.charAt(0)}${staffSession.lastName.charAt(0)}`.toUpperCase()
    : "AD";
  const displayName = staffSession
    ? `${staffSession.firstName} ${staffSession.lastName}`.trim()
    : "Admin User";
  const roleLabel = superAdmin
    ? "Super Admin"
    : staffSession?.role.name || "Staff Member";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 shrink-0 flex-row items-center justify-between gap-2 px-5 py-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        <Logo
          href="/"
          variant="full"
          className="min-w-0 group-data-[collapsible=icon]:hidden"
          imageClassName="h-8 w-auto"
        />
        {/* `lg`-only: below that the sidebar is a drawer, where "collapse to
            icons" is meaningless — the topbar `☰` closes it instead. */}
        <SidebarRailTrigger className="hidden lg:inline-flex" />
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        {filteredGroups.map((group) => (
          <SidebarGroup
            key={group.label ?? group.items[0]?.title}
            className="p-0 pb-2"
          >
            {/* Small tracked caps. DESIGN.md bans this treatment everywhere
                except here — the one sanctioned exception, per the frame. */}
            {/* `hidden` rather than the primitive's `-mt-8 opacity-0` collapse:
                that offset assumes the stock `h-8` label, and this one is taller. */}
            {group.label && (
              <SidebarGroupLabel className="h-auto px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-0">
              {group.items.map((item) => {
                if (item.children?.length) {
                  const subtreeActive = item.children.some((child) =>
                    isPathActive(pathname, child.href ?? ""),
                  );
                  const isOpen = expandedParents[item.title] ?? subtreeActive;
                  return (
                    <NavParentRow
                      key={item.title}
                      item={item}
                      pathname={pathname}
                      isOpen={isOpen}
                      railCollapsed={railCollapsed}
                      onToggle={() =>
                        setExpandedParents((prev) => ({
                          ...prev,
                          [item.title]: !isOpen,
                        }))
                      }
                      onExpandRail={() => {
                        toggleRail();
                        setExpandedParents((prev) => ({
                          ...prev,
                          [item.title]: true,
                        }));
                      }}
                    />
                  );
                }
                return (
                  <NavLeafRow
                    key={item.title}
                    item={item}
                    isActive={isPathActive(pathname, item.href ?? "")}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* The frame's footer: avatar + name + email, with a gear on the right.
          The gear is the settings affordance — which is why ADMIN carries no
          `Settings` nav row (ADR-0016). It opens the account menu rather than
          linking straight to `/settings`, because log out needs a home and the
          frame draws no other control that could hold it.

          Collapsed, there is no room for the gear, so the avatar becomes the
          trigger. Hiding the gear and leaving it at that would strand log out
          behind an expand-first step. */}
      <SidebarFooter className="shrink-0 border-t border-sidebar-border p-4 group-data-[collapsible=icon]:px-0">
        <DropdownMenu>
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <ConditionalDropdownTrigger asTrigger={railCollapsed}>
              <Avatar className="size-9 shrink-0 rounded-full border border-sidebar-border">
                <AvatarImage src={staffSession?.avatarUrl || undefined} />
                <AvatarFallback className="rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary-ink">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </ConditionalDropdownTrigger>

            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="flex items-center gap-1 truncate text-sm font-semibold leading-tight text-sidebar-foreground">
                {superAdmin && (
                  <AppIcon
                    icon="solar:shield-user-bold"
                    className="size-3.5 shrink-0 text-primary-ink"
                    aria-label="Super admin"
                  />
                )}
                <span className="truncate">{displayName}</span>
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                {staffSession?.email || roleLabel}
              </span>
            </div>

            {!railCollapsed && (
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account and settings"
                  className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <AppIcon icon="solar:settings-linear" className="size-[18px]" />
                </button>
              </DropdownMenuTrigger>
            )}
          </div>

          <DropdownMenuContent
            side="top"
            align="end"
            className="w-56 rounded-xl border-border/60"
          >
              <DropdownMenuLabel className="p-2 font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {roleLabel}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 py-2.5"
                onClick={() => router.push("/settings")}
              >
                <AppIcon
                  icon="solar:settings-linear"
                  className="size-4 text-muted-foreground"
                />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 py-2.5 text-destructive-ink focus:bg-destructive/10 focus:text-destructive-ink"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(true)}
              >
                <AppIcon
                  icon="solar:logout-2-linear"
                  className={cn("size-4", isLoggingOut && "animate-pulse")}
                />
                {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LogoutConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleLogout}
          isPending={isLoggingOut}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
