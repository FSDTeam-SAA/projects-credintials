"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FolderIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/components/app/current-user";
import { ServiceLineBadge } from "@/components/badges";
import { ClientDialog } from "@/components/clients/client-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { api, errorMessage } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useDebounced } from "@/lib/hooks";
import { useClient, useProjects } from "@/lib/queries";

export default function ClientProjectsPage() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const qc = useQueryClient();
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-updatedAt");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const { data: client, error: clientError, isPending: clientPending } = useClient(id);
  const { data, error, isPending } = useProjects({ clientId: id, search: debounced, sort, page, limit: 12 });
  async function remove() {
    try { await api.delete(`/clients/${id}`); await qc.invalidateQueries({ queryKey: ["clients"] }); router.push("/clients"); toast.success("Client deleted"); }
    catch (err) { toast.error(errorMessage(err)); throw err; }
  }
  if (clientPending) return <div className="skeleton-shimmer h-64 rounded-xl" />;
  if (!client || clientError) return <EmptyState icon={<FolderIcon />} title="Client not available" description={clientError ? errorMessage(clientError) : "This client may have been deleted."} action={<Button asChild variant="outline"><Link href="/clients">Back to clients</Link></Button>} />;
  return <div className="flex flex-col gap-6">
    <PageHeader back="/clients" title={client.name} description={`${client.projectCount} project${client.projectCount === 1 ? "" : "s"} across all profiles and service lines.`} actions={can.editProjects && <><Button variant="outline" onClick={() => setRenaming(true)}><PencilIcon />Rename</Button><ConfirmDialog title="Delete client?" description="Clients with projects cannot be deleted. Reassign their projects first." onConfirm={remove} trigger={<Button variant="outline" aria-label="Delete client"><Trash2Icon /></Button>} /><Button asChild><Link href={`/projects/new?clientId=${id}`}><PlusIcon />Add Project</Link></Button></>} />
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"><div className="relative min-w-0 w-full sm:flex-1"><SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtitle" /><Input aria-label="Search this client’s projects" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search projects, sites, or repositories…" className="pl-10" /></div><Combobox value={sort} onValueChange={v => { setSort(v); setPage(1); }} aria-label="Sort projects" searchPlaceholder="Search sorting options..." className="sm:w-56" options={[{ value: "-updatedAt", label: "Recently updated" }, { value: "name", label: "Project name A-Z" }, { value: "-name", label: "Project name Z-A" }, { value: "-createdAt", label: "Newest first" }]} /></div>
    {error ? <EmptyState icon={<FolderIcon />} title="Could not load projects" description={errorMessage(error)} /> : isPending ? <div className="skeleton-shimmer h-48 rounded-xl" /> : data?.items.length ? <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.items.map(project => <article key={project.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-surface"><Link href={`/projects/${project.id}`} className="flex-1"><div className="mb-3 flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand"><FolderIcon className="size-5" /></span><ServiceLineBadge value={project.serviceLine} /></div><h2 className="truncate text-lg font-semibold text-title">{project.name}</h2><p className="mt-1 truncate text-sm text-subtitle">{client.name} · {project.profileName?.name ?? "No profile"}</p><p className="mt-3 text-sm text-subtitle">{project.liveSites.length} sites · {project.repositories.length} repositories · {project.resourceCount} resources</p><p className="mt-2 text-xs text-subtitle">Updated {timeAgo(project.updatedAt)}</p></Link><div className="mt-4 flex gap-2"><Button asChild variant="outline" size="sm"><Link href={`/projects/${project.id}`}>View project</Link></Button>{can.editProjects && <Button asChild variant="ghost" size="sm"><Link href={`/projects/${project.id}/edit`}><PencilIcon />Edit</Link></Button>}</div></article>)}</div><PaginationBar meta={data.meta} onPageChange={setPage} /></> : <EmptyState icon={<FolderIcon />} title={search ? "No matching projects" : "This client has no projects yet"} description={search ? "Try another search." : "Create a project for their website, mobile app, or next development request."} action={can.editProjects && !search && <Button asChild><Link href={`/projects/new?clientId=${id}`}><PlusIcon />Add Project</Link></Button>} />}
    <ClientDialog open={renaming} onOpenChange={setRenaming} client={client} />
  </div>;
}
