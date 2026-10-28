"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlarmClockIcon,
  ArrowUpDownIcon,
  ChevronRightIcon,
  EyeIcon,
  FolderSearchIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { ClientSelector } from "@/components/clients/client-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCan, useCurrentUser } from "@/components/app/current-user";
import { Pill, ServiceLineBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { ResourceIcon } from "@/components/projects/resource-icon";
import { expiryLabel, expiryTone, timeAgo } from "@/lib/format";
import { useDebounced } from "@/lib/hooks";
import { useCategories, useExpiring, useProfileNames, useProjectMeta, useProjects } from "@/lib/queries";
import { cn } from "@/lib/utils";

const ALL = "all";
const SORTS = [
  { value: "-updatedAt", label: "Recently updated" },
  { value: "name", label: "Project name A-Z" },
  { value: "-name", label: "Project name Z-A" },
  { value: "clientName", label: "Client name A–Z" },
  { value: "-clientName", label: "Client name Z–A" },
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
];

export function Dashboard() {
  const user = useCurrentUser();
  const can = useCan();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = {
    search: params.get("search") ?? "",
    clientId: params.get("clientId") ?? "",
    category: params.get("category") ?? "",
    profileName: params.get("profileName") ?? "",
    serviceLine: params.get("serviceLine") ?? "",
    expiring: params.get("expiring") ?? "",
    sort: params.get("sort") ?? "-updatedAt",
    page: Number(params.get("page") ?? 1),
  };

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounced(searchInput, 350);

  function setParams(next: Partial<Record<keyof typeof filters, string | number>>, resetPage = true) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === "" || v === ALL || v === undefined || (k === "sort" && v === "-updatedAt")) sp.delete(k);
      else sp.set(k, String(v));
    }
    if (resetPage && !("page" in next)) sp.delete("page");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (debouncedSearch !== filters.search) setParams({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, isPending, isFetching } = useProjects({ ...filters, limit: 10 });
  const { data: categories } = useCategories();
  const { data: profiles } = useProfileNames();
  const { data: meta } = useProjectMeta();

  const hasFilters = !!(filters.clientId || filters.search || filters.category || filters.profileName || filters.serviceLine || filters.expiring);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name}. Find projects, clients, and access details.`}
        actions={
          can.editProjects && (
            <Button asChild variant="default" size="pill" className="group">
              <Link href="/projects/new">
                <PlusIcon className="transition-transform group-hover:rotate-90" />
                Add Project
              </Link>
            </Button>
          )
        }
      />

      <ExpiringPanel onShowAll={() => setParams({ expiring: "true" })} />

      <section className="@container/filters flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-title">Projects</h2>
          {filters.expiring && (
            <Pill tone="yellow" className="animate-pop">
              <AlarmClockIcon className="size-3.5" /> Expiring within 30 days
              <button onClick={() => setParams({ expiring: "" })} aria-label="Remove filter" className="ml-1 hover:opacity-70">
                <XIcon className="size-3.5" />
              </button>
            </Pill>
          )}
          {hasFilters && (
          <Button
            variant="ghost"
            size="sm" className="ml-auto animate-fade-in"
            onClick={() => {
              setSearchInput("");
              router.replace(pathname, { scroll: false });
            }}
          >
            <XIcon /> Clear filters
          </Button>
          )}
        </div>

        {/* Filters */}
        <div className="grid animate-fade-up grid-cols-2 items-end gap-2 rounded-xl border bg-card p-3 shadow-surface @2xl/filters:grid-cols-3 @5xl/filters:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(0,1fr))_minmax(170px,1.1fr)]">
          <div className="col-span-2 min-w-0 @2xl/filters:col-span-1">
            <Label htmlFor="project-search" className="sr-only">Search projects</Label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtitle" />
            <Input
              id="project-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search projects, clients, or links..."
              className="h-10 pl-10 pr-10"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 animate-pop text-subtitle hover:text-title"
                aria-label="Clear search"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2"><Label htmlFor="client-filter" className="sr-only">Client</Label><ClientSelector id="client-filter" className="h-10" value={filters.clientId} onChange={v => setParams({ clientId: v })} allowCreate={false} allowClear /></div>
          <FilterSelect
            label="Category"
            value={filters.category}
            onChange={(v) => setParams({ category: v })}
            options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <FilterSelect
            label="Profile name"
            value={filters.profileName}
            onChange={(v) => setParams({ profileName: v })}
            options={(profiles ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <FilterSelect
            label="Service line"
            value={filters.serviceLine}
            onChange={(v) => setParams({ serviceLine: v })}
            options={(meta?.serviceLines ?? []).map((s) => ({ value: s, label: s }))}
          />
          <div className="flex min-w-0 flex-col gap-2">
            <Label className="sr-only">Sort by</Label>
            <Combobox value={filters.sort} onValueChange={v => setParams({ sort: v })} options={SORTS} className="h-10" aria-label="Sort projects" searchPlaceholder="Search sorting options..." icon={<ArrowUpDownIcon className="size-4 text-subtitle" />} />
          </div>

        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className={cn("h-0.5 w-full overflow-hidden", isFetching && !isPending ? "opacity-100" : "opacity-0")}>
            <div className="h-full w-1/3 animate-[splash-bar_1s_ease-in-out_infinite] bg-brand" />
          </div>
          {/* Phones: one card per project */}
          <ul className="divide-y md:hidden">
            {isPending
              ? Array.from({ length: 4 }, (_, i) => (
                  <li key={i} className="space-y-3 p-4">
                    <div className="skeleton-shimmer h-4 w-2/3 rounded" />
                    <div className="skeleton-shimmer h-3 w-1/3 rounded" />
                    <div className="skeleton-shimmer h-10 rounded-full" />
                  </li>
                ))
              : data?.items.map((p, i) => (
                  <li key={p.id} style={{ "--i": i } as React.CSSProperties} className="stagger">
                    <Link href={`/projects/${p.id}`} className="block space-y-3 p-4 transition-colors active:bg-brand-soft/60">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-title">{p.name}</p>
                          <p className="truncate text-sm text-subtitle">{p.clientName}</p>
                          <p className="truncate text-sm text-subtitle">{p.profileName?.name ?? "—"}</p>
                        </div>
                        <ServiceLineBadge value={p.serviceLine} className="shrink-0" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-subtitle">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-foreground/80">{p.category?.name ?? "—"}</span>
                        <ResourceStack types={p.resourceTypes} count={p.resourceCount} />
                        <span>Updated {timeAgo(p.updatedAt)}</span>
                      </div>
                      {p.nextExpiry && expiryTone(p.nextExpiry) !== "ok" && (
                        <Pill tone={expiryTone(p.nextExpiry) === "danger" ? "red" : "yellow"} className="px-2 py-0.5 text-[11px]">
                          <AlarmClockIcon className="size-3" /> {expiryLabel(p.nextExpiry)}
                        </Pill>
                      )}
                    </Link>
                    <div className="flex gap-2 px-4 pb-4">
                      <Button asChild size="pill" className="h-10 flex-1">
                        <Link href={`/projects/${p.id}`}>
                          <EyeIcon className="size-5!" /> View
                        </Link>
                      </Button>
                      {can.editProjects && (
                        <Button asChild variant="outline" size="pill" className="h-10 flex-1">
                          <Link href={`/projects/${p.id}/edit`}>
                            <PencilIcon /> Edit
                          </Link>
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
          </ul>

          <div className="hidden md:block">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 pl-4 text-xs font-medium text-subtitle">Profile Name</TableHead>
                <TableHead className="text-center text-xs font-medium text-subtitle">Project / Client</TableHead>
                <TableHead className="text-center text-xs font-medium text-subtitle">Category</TableHead>
                <TableHead className="text-center text-xs font-medium text-subtitle">Service line</TableHead>
                <TableHead className="hidden text-center text-xs font-medium text-subtitle xl:table-cell">Resources</TableHead>
                <TableHead className="pr-4 text-right text-xs font-medium text-subtitle">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending
                ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)
                : data?.items.map((p, i) => (
                    <TableRow
                      key={p.id}
                      style={{ "--i": i } as React.CSSProperties}
                      className="stagger group cursor-pointer transition-colors hover:bg-brand-soft/50"
                      onClick={() => router.push(`/projects/${p.id}`)}
                    >
                      <TableCell className="py-3 pl-4">
                        <div className="flex flex-col">
                          <span>{p.profileName?.name ?? "—"}</span>
                          <span className="text-xs text-subtitle">Updated {timeAgo(p.updatedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold text-title">{p.name}</span>
                          {p.client ? <Link href={`/clients/${p.client.id}`} onClick={e => e.stopPropagation()} className="text-sm text-subtitle hover:text-brand">{p.clientName}</Link> : <span className="text-sm text-subtitle">{p.clientName}</span>}
                          {p.nextExpiry && (expiryTone(p.nextExpiry) !== "ok") && (
                            <Pill tone={expiryTone(p.nextExpiry) === "danger" ? "red" : "yellow"} className="px-2 py-0.5 text-[11px]">
                              <AlarmClockIcon className="size-3" /> {expiryLabel(p.nextExpiry)}
                            </Pill>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{p.category?.name ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <ServiceLineBadge value={p.serviceLine} />
                      </TableCell>
                      <TableCell className="hidden text-center xl:table-cell">
                        <ResourceStack types={p.resourceTypes} count={p.resourceCount} />
                      </TableCell>
                      <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="pill" className="h-8 px-3">
                            <Link href={`/projects/${p.id}`}>
                              <EyeIcon className="size-5!" /> View
                            </Link>
                          </Button>
                          {can.editProjects && (
                            <Button asChild variant="ghost" size="pill" className="h-8 px-3">
                              <Link href={`/projects/${p.id}/edit`}>
                                <PencilIcon /> Edit
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          </div>

          {!isPending && data?.items.length === 0 && (
            <EmptyState
              icon={<FolderSearchIcon />}
              title={hasFilters ? "No projects match these filters" : "No projects yet"}
              description={
                hasFilters
                  ? "Try a different search or clear the filters."
                  : can.editProjects
                    ? "Add your first project to start storing its resources and credentials."
                    : "Projects added by the operations team will show up here."
              }
              action={
                can.editProjects &&
                !hasFilters && (
                  <Button asChild size="pill">
                    <Link href="/projects/new">
                      <PlusIcon /> Add Project
                    </Link>
                  </Button>
                )
              }
            />
          )}

          {data && data.meta.total > 0 && (
            <PaginationBar meta={data.meta} onPageChange={(page) => setParams({ page }, false)} />
          )}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label className="sr-only">{label}</Label>
      <Combobox
        value={value || ALL} onValueChange={onChange} aria-label={label}
        searchPlaceholder={`Search ${label.toLowerCase()}...`}
        options={[{ value: ALL, label: label === "Category" ? "All categories" : `All ${label.toLowerCase()}s` }, ...options]}
        className={cn("h-10", value && "border-brand/40 bg-brand-soft/40")}
      />
    </div>
  );
}

function ResourceStack({ types, count }: { types: string[]; count: number }) {
  if (!count) return <span className="text-sm text-subtitle">—</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-2">
          <div className="flex -space-x-2">
            {types.slice(0, 4).map((t) => (
              <ResourceIcon key={t} template={t} type={t} size="sm" className="ring-2 ring-card transition-transform group-hover:-translate-y-0.5" />
            ))}
          </div>
          <span className="text-sm text-subtitle">{count}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {count} resource{count === 1 ? "" : "s"}
      </TooltipContent>
    </Tooltip>
  );
}

function SkeletonRow() {
  return (
    <TableRow className="hover:bg-transparent">
      {[140, 120, 100, 60, 80, 170].map((w, i) => (
        <TableCell key={i} className={cn("py-5", i === 4 && "hidden xl:table-cell")}>
          <div className={cn("skeleton-shimmer h-4 rounded", i > 0 && i < 5 && "mx-auto", i === 5 && "ml-auto h-9 rounded-full")} style={{ width: w }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function ExpiringPanel({ onShowAll }: { onShowAll: () => void }) {
  const { data } = useExpiring();
  if (!data?.length) return null;
  const expired = data.filter((d) => expiryTone(d.expiresAt) === "danger").length;

  return (
    <section className="animate-fade-up overflow-hidden rounded-xl border border-warn/60 bg-warn-soft/60 [animation-delay:80ms]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-warn text-white">
            <AlarmClockIcon className="size-5 animate-[wiggle_2.4s_ease-in-out_infinite]" />
          </span>
          <div>
            <p className="font-semibold text-title">
              {data.length} renewal{data.length === 1 ? "" : "s"} coming up
              {expired > 0 && <span className="text-destructive"> · {expired} already expired</span>}
            </p>
            <p className="text-sm text-subtitle">Domains, hosting and accounts expiring in the next 30 days.</p>
          </div>
        </div>
        <Button variant="outline-warn" size="sm" onClick={onShowAll}>
          Show projects <ChevronRightIcon />
        </Button>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-4 scrollbar-thin">
        {data.slice(0, 8).map((item, i) => {
          const tone = expiryTone(item.expiresAt);
          return (
            <Link
              key={item.resourceId}
              href={`/projects/${item.projectId}#${item.resourceId}`}
              style={{ "--i": i } as React.CSSProperties}
              className="stagger flex min-w-[220px] items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <ResourceIcon type={item.resourceType} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-title">{item.resourceTitle}</p>
                <p className="truncate text-xs text-subtitle">{item.projectName} · {item.clientName}</p>
                <p className={cn("text-xs font-medium", tone === "danger" ? "text-destructive" : "text-warn-text")}>
                  {expiryLabel(item.expiresAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
