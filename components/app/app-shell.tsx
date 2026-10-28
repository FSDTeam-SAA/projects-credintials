"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  FolderPlusIcon,
  LayoutGridIcon,
  LogOutIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  ShapesIcon,
  ShieldCheckIcon,
  UserRoundPlusIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { api, ApiError } from "@/lib/api";
import { initials, roleLabel } from "@/lib/format";
import { useMe, useUserStats } from "@/lib/queries";
import type { Role, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CurrentUserProvider } from "./current-user";
import { SplashScreen } from "./splash-screen";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  match?: (p: string) => boolean;
  badge?: "pending";
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutGridIcon,
        roles: ["admin", "operation", "sales"],
        match: (p) => p.startsWith("/dashboard") || (p.startsWith("/projects") && p !== "/projects/new"),
      },
      { href: "/clients", label: "Clients", icon: UsersRoundIcon, roles: ["admin", "operation", "sales"] },
      { href: "/projects/new", label: "Add Project", icon: FolderPlusIcon, roles: ["operation", "admin"] },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/users", label: "Users", icon: UsersRoundIcon, roles: ["admin"], badge: "pending" },
      { href: "/categories", label: "Categories", icon: ShapesIcon, roles: ["admin"] },
      { href: "/profile-names", label: "Profiles", icon: UserRoundPlusIcon, roles: ["admin"] },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: SettingsIcon, roles: ["admin", "operation", "sales"] }],
  },
];

const COLLAPSE_KEY = "pm.sidebar.collapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: user, error, isPending } = useMe();
  // The shell only renders client-side (splash until /auth/me resolves), so reading storage here is safe.
  const [collapsed, setCollapsed] = useState(() => (typeof window === "undefined" ? false : readCollapsed()));

  // Invalid/expired session: clear the cookie (so proxy.ts stops redirecting) and go to login.
  useEffect(() => {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      api.post("/auth/logout").finally(() => {
        queryClient.clear();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      });
    }
  }, [error, pathname, queryClient, router]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  if (isPending || !user) return <SplashScreen />;

  return (
    <CurrentUserProvider value={user}>
      <div
        className="flex min-h-dvh flex-1 bg-shell"
        style={{ "--sidebar-w": collapsed ? "96px" : "296px" } as React.CSSProperties}
      >
        <aside className="sticky top-0 hidden h-dvh w-(--sidebar-w) shrink-0 p-3 pr-0 transition-[width] duration-300 ease-out lg:block">
          <Sidebar user={user} pathname={pathname} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar user={user} pathname={pathname} />
          <main className="flex-1 bg-background lg:rounded-tl-2xl">
            <div className="mx-auto w-full max-w-[1580px] px-4 py-4 md:px-6 lg:px-7 lg:py-5">{children}</div>
          </main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}

function Sidebar({
  user,
  pathname,
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
}: {
  user: User;
  pathname: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const { data: stats } = useUserStats(user.role === "admin");
  const pending = stats?.pending ?? 0;

  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((n) => n.roles.includes(user.role)) })).filter(
    (g) => g.items.length,
  );
  const activeHref = groups
    .flatMap((g) => g.items)
    .find((item) => (item.match ? item.match(pathname) : pathname.startsWith(item.href)))?.href;

  // Sliding highlight: measure the active link and move one shared pill behind it.
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = navRef.current?.querySelector<HTMLElement>(`[data-href="${activeHref}"]`);
      setPill(el ? { top: el.offsetTop, height: el.offsetHeight } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [activeHref, collapsed]);

  async function logout() {
    setLoggingOut(true);
    await api.post("/auth/logout").catch(() => {});
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-surface">
      {/* Decorative brand glows */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-20 size-56 rounded-full bg-brand/5 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-24 size-56 rounded-full bg-brand/5 blur-3xl" />

      {/* Brand + collapse */}
      <div className={cn("relative flex items-center gap-2 px-4 pt-5 pb-4", collapsed ? "flex-col" : "justify-between")}>
        <Link href="/dashboard" onClick={onNavigate} className="transition-transform duration-300 hover:scale-[1.03]" aria-label="SCALEUP home">
          {collapsed ? (
            <Image src="/logo-mark.png" alt="SCALEUP" width={251} height={251} priority className="size-10 animate-pop" />
          ) : (
            <Logo priority className="w-[168px] animate-fade-in" />
          )}
        </Link>
        {onToggleCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onToggleCollapsed} className="text-muted-foreground" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "Expand" : "Collapse"}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Navigation */}
      <nav ref={navRef} className="relative flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {pill && (
          <span
            aria-hidden
            className="absolute inset-x-3 rounded-xl bg-gradient-to-r from-brand to-[#16c94a] shadow-lg shadow-brand/30 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ top: pill.top, height: pill.height }}
          />
        )}

        {groups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && "mt-5")}>
            {collapsed ? (
              gi > 0 && <div className="mx-auto mb-3 h-px w-8 bg-border" />
            ) : (
              <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">{group.label}</p>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((item, i) => {
                const active = item.href === activeHref;
                const Icon = item.icon;
                const badge = item.badge === "pending" && pending > 0 ? pending : 0;
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    style={{ "--i": gi * 3 + i } as React.CSSProperties}
                    className={cn(
                      "stagger group relative z-10 flex items-center gap-3 rounded-xl p-2 text-sm font-medium transition-colors duration-200",
                      collapsed && "justify-center",
                      active ? "text-white" : "text-title hover:bg-muted/70",
                    )}
                  >
                    <span
                      className={cn(
                        "relative grid size-9 shrink-0 place-items-center rounded-lg transition-all duration-300",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground group-hover:-rotate-6 group-hover:bg-brand-soft group-hover:text-brand",
                      )}
                    >
                      <Icon className="size-[18px]" strokeWidth={active ? 2.25 : 1.9} />
                      {collapsed && badge > 0 && (
                        <span className="absolute -top-1 -right-1 grid size-4 animate-pop place-items-center rounded-full bg-warn text-[10px] font-bold text-white ring-2 ring-card">
                          {badge}
                        </span>
                      )}
                    </span>
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && badge > 0 && (
                      <span
                        className={cn(
                          "grid min-w-5 animate-pop place-items-center rounded-full px-1.5 text-[11px] leading-5 font-semibold",
                          active ? "bg-white text-brand" : "bg-warn text-white",
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
                return collapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                      {badge > 0 && ` · ${badge} pending`}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="relative flex flex-col gap-3 p-3">
        {!collapsed && (
          <div className="animate-fade-in rounded-xl border border-brand/20 bg-gradient-to-br from-brand-soft to-warn-soft/60 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-title">
              <span className="grid size-7 place-items-center rounded-lg bg-brand text-white">
                <ShieldCheckIcon className="size-4" />
              </span>
              Encrypted vault
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-subtitle">Every credential is sealed with AES-256 before it&apos;s stored.</p>
          </div>
        )}

        <div className={cn("flex items-center gap-2 rounded-xl border bg-background/60 p-2 backdrop-blur", collapsed && "flex-col")}>
          <Link href="/settings" onClick={onNavigate} className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-lg">
            <span className="relative">
              <Avatar className="size-9 ring-2 ring-brand/40 transition-transform group-hover:scale-105">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-brand ring-2 ring-card" />
            </span>
            {!collapsed && (
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-semibold text-title">{user.name}</span>
                <span className="truncate text-xs text-subtitle">{roleLabel[user.role]}</span>
              </span>
            )}
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={logout}
                disabled={loggingOut}
                className="group/logout text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="Log out"
              >
                <LogOutIcon className="transition-transform group-hover/logout:translate-x-0.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Log out</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function TopBar({ user, pathname }: { user: User; pathname: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6 lg:justify-end">
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[296px] border-0 bg-transparent p-3 shadow-none" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar user={user} pathname={pathname} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Logo className="w-28" />
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <Link href="/settings" className="group flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-sidebar-accent">
          <Avatar className="size-8 border border-brand transition-transform group-hover:scale-105">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col gap-1 leading-none sm:flex">
            <span className="text-sm font-medium text-title">{user.name}</span>
            <span className="text-xs text-title/80">@{roleLabel[user.role]}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
