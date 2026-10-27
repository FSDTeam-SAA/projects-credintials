"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2Icon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { api, errorMessage } from "@/lib/api";
import { useDebounced } from "@/lib/hooks";
import { useCategories, useProfileNames } from "@/lib/queries";
import type { Lookup } from "@/lib/types";
import { cn } from "@/lib/utils";

type Config = {
  endpoint: "/categories" | "/profile-names";
  queryKey: "categories" | "profile-names";
  title: string;
  description: string;
  listTitle: string;
  singular: string;
  placeholder: string;
  addLabel: string;
  icon: React.ReactNode;
};

export function LookupManager({ config }: { config: Config }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const debounced = useDebounced(search, 250);

  const categories = useCategories(config.queryKey === "categories" ? debounced : "");
  const profiles = useProfileNames(config.queryKey === "profile-names" ? debounced : "");
  const { data: items, isPending } = config.queryKey === "categories" ? categories : profiles;

  const refresh = () => queryClient.invalidateQueries({ queryKey: [config.queryKey] });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError(`${config.singular} is required`);
    setAdding(true);
    setError("");
    try {
      await api.post(config.endpoint, { name });
      toast.success(`"${name.trim()}" added`);
      setName("");
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={config.title} description={config.description} />

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* List */}
        <section className="animate-fade-up rounded-lg bg-card p-4 shadow-surface md:p-6">
          <h2 className="text-base font-medium text-title">{config.listTitle}</h2>
          <p className="mt-1 text-xs text-subtitle">New entries appear immediately in Add Project, Edit Project, and the project filters.</p>
          <div className="relative mt-3">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-subtitle" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search by ${config.singular.toLowerCase()} ...`}
              className="border-warn bg-background pl-11 hover:bg-background"
            />
          </div>

          <ul className="mt-5 divide-y border-t">
            {isPending &&
              Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="py-5">
                  <div className="skeleton-shimmer h-4 w-1/3 rounded" />
                </li>
              ))}
            {items?.map((item, i) => <LookupRow key={item.id} item={item} index={i} config={config} onChanged={refresh} />)}
          </ul>
          {!isPending && items?.length === 0 && (
            <EmptyState
              icon={config.icon}
              title={search ? "Nothing matches" : `No ${config.singular.toLowerCase()}s yet`}
              description={search ? "Try a different search." : "Add the first one using the form."}
              className="py-10"
            />
          )}
        </section>

        {/* Add form */}
        <section className="animate-fade-up rounded-lg bg-card p-4 shadow-surface [animation-delay:80ms] md:p-6 lg:sticky lg:top-24">
          <div className="flex items-start gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-warn-soft text-brand [&_svg]:size-4">{config.icon}</span>
            <div>
              <h2 className="text-xl text-title">Add {config.singular.toLowerCase()}</h2>
              <p className="text-sm text-subtitle">New entries appear immediately in Add Project, Edit Project, and the project filters.</p>
            </div>
          </div>
          <form onSubmit={add} className="mt-6 flex flex-col gap-2">
            <Label htmlFor="lookup-name" className="text-sm font-medium">
              {config.singular} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lookup-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder={config.placeholder}
              aria-invalid={!!error}
              className="bg-brand-soft hover:bg-brand-soft/70"
            />
            {error && <p className="animate-fade-in text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={adding} className="group mt-4 h-11 w-full">
              {adding ? <Loader2Icon className="animate-spin" /> : <PlusIcon className="transition-transform group-hover:rotate-90" />}
              {config.addLabel}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

function LookupRow({ item, index, config, onChanged }: { item: Lookup; index: number; config: Config; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.name);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!value.trim() || value.trim() === item.name) return setEditing(false);
    setSaving(true);
    try {
      await api.patch(`${config.endpoint}/${item.id}`, { name: value });
      toast.success("Renamed");
      setEditing(false);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api.delete(`${config.endpoint}/${item.id}`);
      toast.success(`"${item.name}" deleted`);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  }

  return (
    <li style={{ "--i": Math.min(index, 15) } as React.CSSProperties} className="stagger group flex items-center gap-3 px-2 py-4">
      {editing ? (
        <form
          className="flex flex-1 animate-fade-in items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} className="h-9" onKeyDown={(e) => e.key === "Escape" && setEditing(false)} />
          <Button type="submit" size="icon-sm" disabled={saving} aria-label="Save">
            {saving ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => { setEditing(false); setValue(item.name); }} aria-label="Cancel">
            <XIcon />
          </Button>
        </form>
      ) : (
        <>
          <span className="flex-1 text-sm text-title">{item.name}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs", item.projectCount ? "bg-brand-soft text-brand" : "bg-muted text-subtitle")}>
            {item.projectCount ?? 0} project{item.projectCount === 1 ? "" : "s"}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditing(true)}
            className="text-subtitle opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Rename ${item.name}`}
          >
            <PencilIcon />
          </Button>
          <ConfirmDialog
            title={`Delete "${item.name}"?`}
            description={
              item.projectCount
                ? `It's used by ${item.projectCount} project(s), so it can't be deleted until they're reassigned.`
                : "This can't be undone."
            }
            onConfirm={remove}
            trigger={
              <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${item.name}`}>
                <Trash2Icon />
              </Button>
            }
          />
        </>
      )}
    </li>
  );
}
