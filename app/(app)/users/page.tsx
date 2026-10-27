"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, PlusIcon, SearchIcon, Trash2Icon, UserCheckIcon, UserPlusIcon, UsersRoundIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireRole, useCurrentUser } from "@/components/app/current-user";
import { RoleBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CountUp } from "@/components/count-up";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { api, errorMessage } from "@/lib/api";
import { initials, roleLabel, timeAgo } from "@/lib/format";
import { useDebounced } from "@/lib/hooks";
import { useUsers, useUserStats } from "@/lib/queries";
import type { Role, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AddUserDialog } from "./add-user-dialog";

export default function UsersPage() {
  return (
    <RequireRole roles={["admin"]}>
      <UserManagement />
    </RequireRole>
  );
}

function UserManagement() {
  const me = useCurrentUser();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<Role | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const debounced = useDebounced(search);

  const { data: stats } = useUserStats();
  const { data: pending } = useUsers({ status: "pending", limit: 50 });
  const { data: users, isPending } = useUsers({ role: role === "all" ? undefined : role, search: debounced, page, limit: 10 });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  async function decide(user: User, action: "approve" | "reject") {
    try {
      await api.post(`/users/${user.id}/${action}`);
      toast.success(action === "approve" ? `${user.name} approved` : `${user.name} rejected`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function changeRole(user: User, newRole: Role) {
    if (newRole === user.role) return;
    try {
      await api.patch(`/users/${user.id}`, { role: newRole });
      toast.success(`${user.name} is now ${roleLabel[newRole]}`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function remove(user: User) {
    try {
      await api.delete(`/users/${user.id}`);
      toast.success(`${user.name} removed`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="User Management" description="Approve registrations and manage who can access project credentials." />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard i={0} label="Total Users" value={stats?.total} icon={<UsersRoundIcon />} tone="mixed" />
        <StatCard i={1} label="Operation" value={stats?.operation} icon={<UserPlusIcon />} tone="green" />
        <StatCard i={2} label="Sales" value={stats?.sales} icon={<UserPlusIcon />} tone="yellow" />
      </div>

      {/* Awaiting approval */}
      <section className="animate-fade-up rounded-lg bg-card p-4 shadow-surface [animation-delay:120ms] md:p-6">
        <div className="mb-2 flex items-start justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="text-2xl font-medium text-title">Awaiting approval</h2>
            <p className="mt-1 font-medium text-title/90">
              {pending?.meta.total ?? 0} registration{pending?.meta.total === 1 ? "" : "s"} to review
            </p>
          </div>
          {!!pending?.meta.total && (
            <span className="relative mt-2 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-warn opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-warn" />
            </span>
          )}
        </div>
        {pending?.items.length ? (
          <ul className="divide-y">
            {pending.items.map((u, i) => (
              <li key={u.id} style={{ "--i": i } as React.CSSProperties} className="stagger flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10 border border-brand">
                    <AvatarFallback className="bg-brand-soft font-semibold text-brand">{initials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium text-title">{u.name}</span>
                    <span className="text-sm text-title/80">
                      {u.employeeId} · {u.email}
                    </span>
                    <RoleBadge role={u.role} className="w-fit" />
                    <span className="text-xs text-subtitle">Registered {timeAgo(u.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="h-12 w-[110px] rounded-sm" onClick={() => decide(u, "approve")}>
                    <CheckIcon /> Approve
                  </Button>
                  <ConfirmDialog
                    title={`Reject ${u.name}?`}
                    description="They won't be able to log in. You can still delete the account later."
                    confirmLabel="Reject"
                    onConfirm={() => decide(u, "reject")}
                    trigger={
                      <Button variant="outline-destructive" className="h-12 rounded-sm">
                        <XIcon /> Reject
                      </Button>
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 py-6 text-sm text-subtitle">
            <UserCheckIcon className="size-4 text-brand" /> All caught up — no registrations waiting.
          </p>
        )}
      </section>

      {/* Users table */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={role} onValueChange={(v) => { setRole(v as Role | "all"); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="operation">Operation</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtitle" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name, email, ID"
                className="h-10 w-full border-warn/60 sm:w-[240px] bg-background pl-9 hover:bg-background"
              />
            </div>
            <Button size="pill" className="group" onClick={() => setAddOpen(true)}>
              <PlusIcon className="transition-transform group-hover:rotate-90" /> <span className="hidden sm:inline">Add User</span><span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          {/* Phones: one card per user */}
          <ul className="divide-y md:hidden">
            {isPending
              ? Array.from({ length: 4 }, (_, i) => (
                  <li key={i} className="p-4">
                    <div className="skeleton-shimmer h-10 rounded-lg" />
                  </li>
                ))
              : users?.items.map((u, i) => {
                  const self = u.id === me.id;
                  return (
                    <li key={u.id} style={{ "--i": i } as React.CSSProperties} className="stagger flex items-center gap-3 p-4">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-muted text-xs font-semibold">{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate font-medium text-title">
                          {u.name} {self && <span className="text-xs font-normal text-subtitle">(you)</span>}
                        </span>
                        <span className="truncate text-xs text-subtitle">{u.email}</span>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-subtitle">
                          <RoleControl user={u} disabled={self} onChange={changeRole} />
                          <span>ID {u.employeeId}</span>
                          <span>· {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "never logged in"}</span>
                        </div>
                      </div>
                      <DeleteUser user={u} disabled={self} onConfirm={remove} />
                    </li>
                  );
                })}
          </ul>

          <div className="hidden md:block">
          <Table className="text-base">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-12 pl-4 font-bold text-title">User Name</TableHead>
                <TableHead className="font-bold text-title">E_ID</TableHead>
                <TableHead className="text-center font-bold text-title">Role</TableHead>
                <TableHead className="hidden font-bold text-title md:table-cell">Last login</TableHead>
                <TableHead className="pr-6 text-right font-bold text-title">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="py-4">
                        <div className="skeleton-shimmer h-5 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                : users?.items.map((u, i) => {
                    const self = u.id === me.id;
                    return (
                      <TableRow key={u.id} style={{ "--i": i } as React.CSSProperties} className="stagger">
                        <TableCell className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-muted text-xs font-semibold">{initials(u.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span>
                                {u.name} {self && <span className="text-xs text-subtitle">(you)</span>}
                              </span>
                              <span className="text-xs text-subtitle">{u.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{u.employeeId}</TableCell>
                        <TableCell className="text-center">
                          <RoleControl user={u} disabled={self} onChange={changeRole} />
                        </TableCell>
                        <TableCell className="hidden text-sm text-subtitle md:table-cell">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}</TableCell>
                        <TableCell className="pr-4 text-right">
                          <DeleteUser user={u} disabled={self} onConfirm={remove} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
          </div>
          {!isPending && users?.items.length === 0 && (
            <EmptyState icon={<UsersRoundIcon />} title="No users found" description="Try another search or role." />
          )}
          {users && users.meta.total > 0 && <PaginationBar meta={users.meta} onPageChange={setPage} />}
        </div>
      </section>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onCreated={refresh} />
    </div>
  );
}

function RoleControl({ user, disabled, onChange }: { user: User; disabled: boolean; onChange: (u: User, r: Role) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={disabled} className="rounded-full transition-transform enabled:hover:scale-105 disabled:cursor-default">
        <RoleBadge role={user.role} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Change role</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={user.role} onValueChange={(v) => onChange(user, v as Role)}>
          {(["operation", "sales", "admin"] as Role[]).map((r) => (
            <DropdownMenuRadioItem key={r} value={r}>
              {roleLabel[r]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeleteUser({ user, disabled, onConfirm }: { user: User; disabled: boolean; onConfirm: (u: User) => Promise<void> }) {
  return (
    <ConfirmDialog
      title={`Delete ${user.name}?`}
      description="This removes their account permanently. Projects they created are kept."
      onConfirm={() => onConfirm(user)}
      trigger={
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Delete ${user.name}`}
        >
          <Trash2Icon />
        </Button>
      }
    />
  );
}

const toneStyles = {
  mixed: { icon: "bg-gradient-to-b from-warn to-brand", from: "#04b22f", to: "#febf00" },
  green: { icon: "bg-brand", from: "#04b22f", to: "#04b22f" },
  yellow: { icon: "bg-warn", from: "#febf00", to: "#febf00" },
};

function StatCard({ label, value, icon, tone, i }: { label: string; value?: number; icon: React.ReactNode; tone: keyof typeof toneStyles; i: number }) {
  const s = toneStyles[tone];
  const gid = `wave-${tone}`;
  return (
    <div
      style={{ "--i": i } as React.CSSProperties}
      className="stagger group relative overflow-hidden rounded-lg bg-card p-4 shadow-surface transition-all hover:-translate-y-0.5 hover:shadow-surface-hover"
    >
      <div className={cn("grid size-8 place-items-center rounded-md border border-warn text-white [&_svg]:size-4", s.icon)}>{icon}</div>
      <p className="mt-4 text-sm text-title">{label}</p>
      <p className="text-3xl font-semibold text-title">{value === undefined ? <span className="skeleton-shimmer inline-block h-7 w-10 rounded" /> : <CountUp value={value} />}</p>
      <svg viewBox="0 0 90 42" className="absolute right-4 bottom-4 h-[42px] w-[90px] transition-transform duration-500 group-hover:scale-110" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.to} />
            <stop offset="100%" stopColor={s.from} />
          </linearGradient>
        </defs>
        <path d="M0 42 C 12 40, 18 26, 30 30 S 44 38, 52 22 S 66 8, 72 20 S 84 6, 90 0 L 90 42 Z" fill={`url(#${gid})`} />
      </svg>
    </div>
  );
}
