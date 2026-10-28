"use client";

import { useState } from "react";
import { ChevronsUpDownIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { comboboxContentClassName, comboboxTriggerClassName } from "@/components/ui/combobox";
import { useClient, useClientOptions } from "@/lib/queries";
import { useDebounced } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ClientDialog } from "./client-dialog";

export function ClientSelector({ value, onChange, id, invalid, allowCreate = true, allowClear = false, triggerRef, onBlur, className }: {
  value: string; onChange: (value: string) => void; id?: string; invalid?: boolean; allowCreate?: boolean; allowClear?: boolean;
  triggerRef?: React.Ref<HTMLButtonElement>; onBlur?: () => void; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const query = useDebounced(search);
  const { data: selected, isError: selectedError } = useClient(value);
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useClientOptions(query);
  const options = data?.pages.flatMap(p => p.items) ?? [];
  return <>
    <Popover open={open} onOpenChange={next => { if (next) setSearch(""); setOpen(next); }}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" ref={triggerRef} onBlur={onBlur} variant="outline" role="combobox" aria-expanded={open} aria-label={id ? undefined : "Client"} aria-invalid={invalid} className={cn(comboboxTriggerClassName, className)}>
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>{selected?.name ?? (value ? selectedError ? "Client unavailable" : "Loading client…" : allowClear ? "All clients" : "Select a client")}</span><ChevronsUpDownIcon className="size-4 shrink-0 text-subtitle" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className={comboboxContentClassName}>
        <Command shouldFilter={false} className="h-auto min-h-0" onKeyDown={event => event.stopPropagation()}>
          <CommandInput aria-label="Search clients" value={search} onValueChange={setSearch} placeholder="Search clients…" />
          <CommandList className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-7rem))] p-1">
            {isPending ? <div className="flex items-center gap-2 p-4 text-sm text-subtitle"><Loader2Icon className="size-4 animate-spin" />Loading clients…</div> : isError ? <p className="p-4 text-sm text-destructive">Could not load clients. Try again.</p> : <CommandEmpty>No clients found.</CommandEmpty>}
            {allowClear && <CommandItem value="all-clients" data-checked={!value} className="cursor-pointer rounded-lg px-3 py-2.5 data-[checked=true]:bg-brand-soft data-[checked=true]:text-accent-foreground" onSelect={() => { onChange(""); setOpen(false); }}>All clients</CommandItem>}
            {options.map(client => <CommandItem key={client.id} value={client.id} data-checked={value === client.id} onSelect={() => { onChange(client.id); setOpen(false); }} className="cursor-pointer gap-2 rounded-lg px-3 py-2.5 data-[checked=true]:bg-brand-soft data-[checked=true]:text-accent-foreground"><span className="min-w-0 flex-1 truncate">{client.name}</span><span className="shrink-0 text-xs text-subtitle">{client.projectCount} {client.projectCount === 1 ? "project" : "projects"}</span></CommandItem>)}
            {hasNextPage && <CommandItem value="load-more" disabled={isFetchingNextPage} onSelect={() => { void fetchNextPage(); }}>{isFetchingNextPage ? "Loading…" : "Load more clients"}</CommandItem>}
          </CommandList>
        </Command>
        {allowCreate && (
          <div className="border-t bg-muted/20 p-2.5">
            <Button type="button" className="h-10 w-full font-semibold" onClick={() => { setOpen(false); setCreating(true); }}>
              <PlusIcon />Create new client
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
    {allowCreate && <ClientDialog open={creating} onOpenChange={setCreating} initialName={search} onSaved={client => { onChange(client.id); setSearch(""); }} />}
  </>;
}
