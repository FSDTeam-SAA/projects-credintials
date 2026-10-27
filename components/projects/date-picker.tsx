"use client";

import { useState } from "react";
import { addMonths, addYears } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { expiryLabel, expiryTone, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "+1 month", fn: (d: Date) => addMonths(d, 1) },
  { label: "+6 months", fn: (d: Date) => addMonths(d, 6) },
  { label: "+1 year", fn: (d: Date) => addYears(d, 1) },
];

/** Renewal/expiry date picker with quick presets and an at-a-glance countdown. */
export function ExpiryPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;
  const tone = value ? expiryTone(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-11 w-full items-center gap-2 rounded-lg border border-transparent bg-field/70 px-3.5 text-left text-sm transition-all hover:bg-field",
              open && "border-ring bg-background ring-3 ring-ring/50",
            )}
          >
            <CalendarIcon className="size-4 text-subtitle" />
            {date ? (
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="text-foreground">{shortDate(date)}</span>
                <span
                  className={cn(
                    "truncate text-xs",
                    tone === "danger" && "text-destructive",
                    tone === "warn" && "text-warn-text",
                    tone === "ok" && "text-subtitle",
                  )}
                >
                  · {expiryLabel(date)}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">No renewal date</span>
            )}
          </button>
        </PopoverTrigger>
        {date && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-subtitle hover:bg-muted hover:text-title"
            aria-label="Clear date"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-1.5 border-b p-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              size="xs"
              variant="soft"
              onClick={() => {
                onChange(p.fn(new Date()).toISOString());
                setOpen(false);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          captionLayout="dropdown"
          onSelect={(d) => {
            onChange(d ? d.toISOString() : null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
