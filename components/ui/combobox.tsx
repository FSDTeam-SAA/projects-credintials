"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { ChevronsUpDownIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const comboboxTriggerClassName = "h-10 w-full min-w-0 justify-between gap-3 rounded-lg border-border bg-field/50 px-3.5 text-left font-normal hover:bg-field aria-invalid:ring-0 dark:aria-invalid:ring-0 focus-visible:border-ring/60 focus-visible:ring-0 data-[state=open]:border-ring/60 data-[state=open]:bg-background data-[state=open]:ring-0";
export const comboboxContentClassName = "w-(--radix-popover-trigger-width) min-w-[min(16rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] max-h-(--radix-popover-content-available-height) gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-xl ring-0";

export type ComboboxOption = { value: string; label: string; keywords?: string[]; disabled?: boolean };
type ComboboxProps = Pick<ComponentProps<typeof Button>, "id" | "ref" | "name" | "onBlur" | "disabled" | "className" | "aria-label" | "aria-invalid"> & {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  size?: "default" | "sm";
  icon?: ReactNode;
  loading?: boolean;
};

/** shadcn's Popover + Command pattern, shared by project fields and filters. */
export function Combobox({
  value, onValueChange, options, placeholder = "Select an option", searchPlaceholder = "Search options...",
  emptyText = "No options found.", size = "default", className, icon, loading, ...props
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find(option => option.value === value);

  function changeOpen(next: boolean) {
    if (next) setSearch("");
    setOpen(next);
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={props.id ? undefined : placeholder}
          {...props}
          className={cn(comboboxTriggerClassName, size === "sm" && "h-9 px-3 text-xs", className)}
        >
          {icon}
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>{selected?.label ?? placeholder}</span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className={comboboxContentClassName}>
        <Command className="h-auto min-h-0" onKeyDown={event => event.stopPropagation()}>
          <CommandInput aria-label={searchPlaceholder} placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-3.5rem))] scroll-py-1 p-1">
            {loading ? (
              <div role="status" className="flex items-center gap-2 p-3 text-sm text-subtitle"><Loader2Icon className="size-4 animate-spin" />Loading options...</div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup className="p-0">
                  {options.map(option => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label, ...(option.keywords ?? [])]}
                      disabled={option.disabled}
                      data-checked={value === option.value}
                      className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 data-[checked=true]:bg-brand-soft data-[checked=true]:text-accent-foreground"
                      onSelect={() => { onValueChange(option.value); setOpen(false); }}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
