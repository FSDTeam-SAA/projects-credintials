"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, FolderIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon, UsersRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/components/app/current-user";
import { ClientDialog } from "@/components/clients/client-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import { useDebounced } from "@/lib/hooks";
import { useClients } from "@/lib/queries";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const can = useCan();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client>();
  const debounced = useDebounced(search);
  const { data, isPending, error } = useClients({ search: debounced, page, limit: 12 });
  async function remove(client: Client) {
    try { await api.delete(`/clients/${client.id}`); await qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Client deleted"); if (data?.items.length === 1 && page > 1) setPage(page - 1); }
    catch (err) { toast.error(errorMessage(err)); throw err; }
  }
  return <div className="flex flex-col gap-6">
    <PageHeader title="Clients" description="One place for every client and all of their projects." actions={can.editProjects && <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}><PlusIcon />Add Client</Button>} />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
      <div className="relative w-full sm:max-w-sm"><SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtitle" /><Input aria-label="Search clients" placeholder="Search clients…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" /></div>
      {data && <p className="text-sm text-subtitle">{data.meta.total} client{data.meta.total === 1 ? "" : "s"}</p>}
    </div>
    {error ? <EmptyState icon={<UsersRoundIcon />} title="Could not load clients" description={errorMessage(error)} /> : isPending ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0,1,2].map(i => <div key={i} className="skeleton-shimmer h-40 rounded-xl" />)}</div> : data?.items.length ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.items.map(client => <article key={client.id} className="flex flex-col rounded-xl border bg-card shadow-surface transition-shadow hover:shadow-surface-hover">
        <Link href={`/clients/${client.id}`} className="flex flex-1 items-start gap-3 p-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><UsersRoundIcon className="size-5" /></span><div className="min-w-0"><h2 className="truncate text-lg font-semibold text-title">{client.name}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-subtitle"><FolderIcon className="size-3.5" />{client.projectCount} project{client.projectCount === 1 ? "" : "s"}</p></div></Link>
        <div className="flex items-center gap-1 border-t px-4 py-3"><Button asChild variant="ghost" size="sm" className="mr-auto text-brand"><Link href={`/clients/${client.id}`}>View projects<ArrowRightIcon /></Link></Button>{can.editProjects && <><Button variant="ghost" size="icon-sm" aria-label={`Rename ${client.name}`} onClick={() => { setEditing(client); setDialogOpen(true); }}><PencilIcon /></Button><ConfirmDialog title="Delete client?" description={`Delete ${client.name}? Clients with projects must have their projects reassigned first.`} onConfirm={() => remove(client)} trigger={<Button variant="ghost" size="icon-sm" aria-label={`Delete ${client.name}`} className="text-subtitle hover:text-destructive"><Trash2Icon /></Button>} /></>}</div>
      </article>)}</div><PaginationBar meta={data.meta} onPageChange={setPage} />
    </> : <EmptyState icon={<UsersRoundIcon />} title={search ? "No clients match your search" : "No clients yet"} description={search ? "Try a different client name." : "Add a client, then organize their work into separate projects."} action={can.editProjects && !search && <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}><PlusIcon />Add Client</Button>} />}
    <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} />
  </div>;
}
