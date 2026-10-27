"use client";

import { FileCode2Icon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ResourceTemplate } from "@/lib/types";
import { ResourceIcon } from "./resource-icon";

/** Searchable "what are you adding?" palette. Picking a template pre-fills the right fields. */
export function TemplatePicker({
  open,
  onOpenChange,
  templates,
  onPick,
  onImportEnv,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templates: ResourceTemplate[];
  onPick: (t: ResourceTemplate) => void;
  onImportEnv: () => void;
}) {
  const groups = templates.reduce<Record<string, ResourceTemplate[]>>((acc, t) => {
    (acc[t.group] ??= []).push(t);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-lg">Add a resource</DialogTitle>
          <DialogDescription>Pick what you&apos;re storing — the right fields are filled in for you.</DialogDescription>
        </DialogHeader>
        <Command className="rounded-none">
          <CommandInput placeholder="Search: VPS, MongoDB, Stripe, App Store…" />
          <CommandList className="max-h-[min(420px,55dvh)] scrollbar-thin">
            <CommandEmpty>No template found. Try &quot;Custom&quot;.</CommandEmpty>
            {Object.entries(groups).map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map((t) => (
                  <CommandItem
                    key={t.key}
                    value={`${t.label} ${t.type} ${t.fields.map((f) => f.label).join(" ")}`}
                    onSelect={() => {
                      if (t.key === "env") onImportEnv();
                      else onPick(t);
                      onOpenChange(false);
                    }}
                    className="gap-3 py-2.5"
                  >
                    {t.key === "env" ? (
                      <span className="grid size-9 place-items-center rounded-lg bg-yellow-500/10 text-yellow-600">
                        <FileCode2Icon className="size-[18px]" />
                      </span>
                    ) : (
                      <ResourceIcon template={t.key} type={t.type} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-title">{t.label}</p>
                      <p className="truncate text-xs text-subtitle">
                        {t.key === "env" ? "Paste or upload a .env file" : t.fields.map((f) => f.label).join(" · ") || "Empty"}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
