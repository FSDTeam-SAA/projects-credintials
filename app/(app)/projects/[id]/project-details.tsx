"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlarmClockIcon,
  ChevronDownIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  CopyPlusIcon,
  ExternalLinkIcon,
  FileDownIcon,
  FolderXIcon,
  GitBranchIcon,
  GlobeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCan } from "@/components/app/current-user";
import { EnvBadge, Pill, ServiceLineBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CopyButton, copyText } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ResourceIcon } from "@/components/projects/resource-icon";
import { api, errorMessage } from "@/lib/api";
import { resourceToText, toEnv } from "@/lib/credentials";
import { expiryLabel, expiryTone, shortDate, timeAgo } from "@/lib/format";
import { useProject } from "@/lib/queries";
import type { Project, Resource } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, isPending, error } = useProject(id);

  if (isPending) return <DetailsSkeleton />;
  if (error || !project) {
    return (
      <EmptyState
        icon={<FolderXIcon />}
        title="Project not found"
        description={error ? errorMessage(error) : "It may have been deleted."}
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    );
  }
  return <Details project={project} />;
}

function Details({ project }: { project: Project }) {
  const can = useCan();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(project.resources.map((r) => r.id!)));
  // Deep link from the "expiring soon" panel: /projects/:id#<resourceId>
  const [highlight, setHighlight] = useState<string | null>(() => window.location.hash.slice(1) || null);

  useEffect(() => {
    if (!highlight) return;
    const scroll = setTimeout(() => document.getElementById(highlight)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    const clear = setTimeout(() => setHighlight(null), 2600);
    return () => {
      clearTimeout(scroll);
      clearTimeout(clear);
    };
  }, [highlight]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return project.resources;
    return project.resources
      .map((r) => {
        const resourceHit = [r.title, r.type, r.url, r.notes].some((v) => v?.toLowerCase().includes(q));
        const creds = r.credentials.filter((c) => c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q));
        if (resourceHit) return r;
        return creds.length ? { ...r, credentials: creds } : null;
      })
      .filter(Boolean) as Resource[];
  }, [project.resources, query]);

  const allOpen = openIds.size >= project.resources.length;

  async function duplicate() {
    try {
      const { project: copy } = await api.post<{ project: Project }>(`/projects/${project.id}/duplicate`);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Project duplicated");
      router.push(`/projects/${copy.id}/edit`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function remove() {
    try {
      await api.delete(`/projects/${project.id}`);
      queryClient.removeQueries({ queryKey: ["projects", "detail", project.id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Project deleted");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  function copyAll() {
    const text = [
      `Project: ${project.name}`,
      `Client: ${project.clientName}`,
      `Profile: ${project.profileName?.name ?? ""}`,
      `Category: ${project.category?.name ?? ""}`,
      `Service line: ${project.serviceLine}`,
      ...project.liveSites.map(l => `Live site - ${l.label}: ${l.url}`),
      ...project.repositories.map(l => `Repository - ${l.label}: ${l.url}`),
      "",
      ...project.resources.map((r) => resourceToText(r) + "\n"),
    ]
      .filter((l) => typeof l === "string")
      .join("\n");
    copyText(text, "All project access copied");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back="/dashboard"
        title={project.name}
        description={project.clientName}
        actions={
          <>
            {can.editProjects && (
              <Button asChild variant="warn" size="pill">
                <Link href={`/projects/${project.id}/edit`}>
                  <PencilIcon /> Edit
                </Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full" aria-label="More actions">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={copyAll}>
                  <ClipboardListIcon /> Copy everything
                </DropdownMenuItem>
                {can.editProjects && (
                  <DropdownMenuItem onSelect={duplicate}>
                    <CopyPlusIcon /> Duplicate project
                  </DropdownMenuItem>
                )}
                {can.editProjects && (
                  <>
                    <DropdownMenuSeparator />
                    <ConfirmDialog
                      title="Delete this project?"
                      description={`"${project.name}" for ${project.clientName} and all ${project.resources.length} stored resources will be permanently deleted.`}
                      onConfirm={remove}
                      trigger={
                        <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                          <Trash2Icon /> Delete project
                        </DropdownMenuItem>
                      }
                    />
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* Project information */}
      <section className="flex animate-fade-up flex-col gap-5 [animation-delay:60ms]">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-title">Project Information</h2>{project.client && <Button asChild variant="outline" size="sm"><Link href={`/clients/${project.client.id}`}>View client&apos;s projects</Link></Button>}</div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoField label="Client Name" value={project.clientName} />
          <InfoField label="Profile Name" value={project.profileName?.name ?? "—"} />
          <InfoField label="Category" value={project.category?.name ?? "—"} />
          <InfoField label="Service Line" value={project.serviceLine} badge={<ServiceLineBadge value={project.serviceLine} className="bg-background/70" />} />
        </div>

        {(project.liveSites.length > 0 || project.repositories.length > 0) && <div className="grid gap-4 lg:grid-cols-2">
          <ProjectLinkList title="Live sites" links={project.liveSites} icon={<GlobeIcon />} />
          <ProjectLinkList title="Repositories" links={project.repositories} icon={<GitBranchIcon />} />
        </div>}
        {project.tags.length > 0 && <div className="flex flex-wrap gap-2">{project.tags.map(t => <Link key={t} href={`/dashboard?search=${encodeURIComponent(t)}`}><Pill>#{t}</Pill></Link>)}</div>}

        {project.notes && (
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm whitespace-pre-wrap">
            <span className="mb-1 block text-xs font-medium tracking-wide text-subtitle uppercase">Notes</span>
            {project.notes}
          </div>
        )}

        <p className="text-xs text-subtitle">
          Created {shortDate(project.createdAt)}
          {project.createdBy?.name && ` by ${project.createdBy.name}`} · Last updated {timeAgo(project.updatedAt)}
          {project.updatedBy?.name && ` by ${project.updatedBy.name}`}
        </p>
      </section>

      {/* Resources */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium text-title">
            Resources &amp; Access <span className="text-subtitle">({project.resources.length})</span>
          </h2>
          {project.resources.length > 0 && (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtitle" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a field, e.g. password"
                  className="h-9 w-full border-border sm:w-[220px] bg-background pl-9 text-sm hover:bg-background md:w-[260px]"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenIds(allOpen ? new Set() : new Set(project.resources.map((r) => r.id!)))}
              >
                {allOpen ? <ChevronsDownUpIcon /> : <ChevronsUpDownIcon />}
                {allOpen ? "Collapse all" : "Expand all"}
              </Button>
            </div>
          )}
        </div>

        {project.resources.length === 0 ? (
          <EmptyState
            icon={<ClipboardListIcon />}
            title="No resources stored yet"
            description="Add servers, accounts and keys so the team can find them here."
            action={
              can.editProjects && (
                <Button asChild>
                  <Link href={`/projects/${project.id}/edit`}>Add resources</Link>
                </Button>
              )
            }
          />
        ) : visible.length === 0 ? (
          <p className="animate-fade-in rounded-xl border border-dashed p-8 text-center text-sm text-subtitle">Nothing matches “{query}”.</p>
        ) : (
          visible.map((r, i) => (
            <ResourceCard
              key={r.id}
              resource={r}
              index={i}
              query={query}
              open={!!query || openIds.has(r.id!)}
              highlight={highlight === r.id}
              onOpenChange={(o) =>
                setOpenIds((s) => {
                  const next = new Set(s);
                  if (o) next.add(r.id!);
                  else next.delete(r.id!);
                  return next;
                })
              }
            />
          ))
        )}
      </section>
    </div>
  );
}

function InfoField({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-subtitle">{label}</span>
      <div className="group flex h-10 items-center justify-between gap-2 rounded-xl bg-field/50 px-3 text-sm text-foreground">
        {badge ?? <span className="truncate">{value}</span>}
        <CopyButton value={value} size="icon-xs" className="opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  );
}

function ProjectLinkList({ title, links, icon }: { title: string; links: { label: string; url: string }[]; icon: React.ReactNode }) {
  return <section className="rounded-xl border bg-card p-4"><h3 className="mb-3 flex items-center gap-2 font-semibold [&_svg]:size-4">{icon}{title}<span className="text-sm font-normal text-subtitle">({links.length})</span></h3>
    {links.length === 0 ? <p className="text-sm text-subtitle">No links added.</p> : <ul className="flex flex-col gap-2">{links.map((link, i) => <li key={i} className="flex items-center gap-2 rounded-lg bg-field/50 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{link.label}</p><p className="truncate text-xs text-subtitle">{link.url}</p></div><CopyButton value={link.url} label={`Copy ${link.label} URL`} size="icon-sm" /><Button asChild size="sm" variant="outline"><a href={link.url} target="_blank" rel="noreferrer"><ExternalLinkIcon />Open<span className="sr-only"> {link.label}</span></a></Button></li>)}</ul>}
  </section>;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-warn/30 px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function ResourceCard({
  resource: r,
  index,
  open,
  onOpenChange,
  highlight,
  query,
}: {
  resource: Resource;
  index: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  highlight: boolean;
  query: string;
}) {
  const tone = r.expiresAt ? expiryTone(r.expiresAt) : null;

  return (
    <Collapsible
      id={r.id}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "stagger scroll-mt-28 rounded-xl border border-border bg-card transition-colors duration-200",
        open ? "shadow-sm" : "hover:shadow-sm",
        highlight && "ring-4 ring-warn/40",
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <ResourceIcon template={r.template} type={r.type} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-title">
              <Highlight text={r.title} query={query} />
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-subtitle">{r.type}</span>
              <EnvBadge env={r.environment} />
              {r.expiresAt && tone !== "ok" && (
                <Pill tone={tone === "danger" ? "red" : "yellow"} className="px-2 py-0.5 text-[11px]">
                  <AlarmClockIcon className="size-3" /> {expiryLabel(r.expiresAt)}
                </Pill>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <ChevronDownIcon
          onClick={() => onOpenChange(!open)}
          className={cn("size-4 shrink-0 cursor-pointer text-title transition-transform duration-300", !open && "-rotate-90")}
        />
        {r.url && (
          <Button asChild variant="outline" size="sm" className="border-border text-foreground hover:bg-muted">
            <a href={r.url} target="_blank" rel="noreferrer">
              <ExternalLinkIcon /> <span className="hidden sm:inline">Open Link</span>
            </a>
          </Button>
        )}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Copy options">
                  <ClipboardListIcon />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Copy resource</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => copyText(resourceToText(r), `${r.title} copied`)}>
              <ClipboardListIcon /> Copy as text
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => copyText(toEnv(r.credentials), ".env copied")} disabled={!r.credentials.length}>
              <FileDownIcon /> Copy as .env
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CollapsibleContent>
        <div className="flex flex-col gap-1 px-1.5 pb-3 text-sm sm:px-3 sm:pl-[60px]">
          {r.url && (
            <Row label="Resource credentials URL">
              <a href={r.url} target="_blank" rel="noreferrer" className="break-all text-brand hover:underline">
                <Highlight text={r.url} query={query} />
              </a>
              <CopyButton value={r.url} size="icon-xs" className="ml-auto" />
            </Row>
          )}
          {r.credentials.length === 0 && !r.url && (
            <Row label="Resource credentials">
              <span className="text-title">No login credentials required</span>
            </Row>
          )}
          {r.credentials.map((c, ci) => (
            <Row key={c.id ?? ci} label={<Highlight text={c.label} query={query} />} multiline={c.kind === "multiline" && !!c.value}>
              {c.kind === "multiline" && c.value ? (
                <pre className="max-h-48 flex-1 overflow-auto rounded-md bg-muted p-2.5 font-mono text-xs whitespace-pre-wrap text-title scrollbar-thin">
                  {c.value}
                </pre>
              ) : c.kind === "url" && c.value ? (
                <a href={c.value} target="_blank" rel="noreferrer" className="font-medium break-all text-brand hover:underline">
                  <Highlight text={c.value} query={query} />
                </a>
              ) : (
                <span className={cn("font-medium break-all text-brand", c.kind === "secret" && "font-mono text-[13px]", !c.value && "text-muted-foreground")}>
                  {c.value ? <Highlight text={c.value} query={query} /> : "—"}
                </span>
              )}
              <CopyButton value={c.value} label={`Copy ${c.label}`} toastLabel={`${c.label} copied`} size="icon-xs" className="ml-auto shrink-0" />
            </Row>
          ))}
          {r.expiresAt && (
            <Row label="Renews / expires">
              <span className={cn("text-title", tone === "danger" && "text-destructive", tone === "warn" && "text-warn-text")}>
                {shortDate(r.expiresAt)} · {expiryLabel(r.expiresAt)}
              </span>
            </Row>
          )}
          {r.notes && (
            <Row label="Notes:">
              <span className="whitespace-pre-wrap text-title">
                <Highlight text={r.notes} query={query} />
              </span>
            </Row>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Row({ label, children, multiline }: { label: React.ReactNode; children: React.ReactNode; multiline?: boolean }) {
  return (
    <div className={cn("group/row flex flex-col gap-1 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 sm:gap-3", !multiline && "sm:flex-row sm:items-center")}>
      <span className="shrink-0 text-xs text-subtitle sm:text-sm">{label}</span>
      <div className="flex min-w-0 flex-1 items-start gap-2">{children}</div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton-shimmer h-12 w-72 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton-shimmer h-24 rounded-lg" />
      ))}
    </div>
  );
}
