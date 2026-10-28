"use client";

import { useState } from "react";
import { TagIcon, XIcon } from "lucide-react";
import { useTags } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Chip input: Enter / comma adds a tag, Backspace removes the last one, existing tags are suggested. */
export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const { data: allTags = [] } = useTags();

  const suggestions = allTags
    .filter((t) => !value.includes(t) && (!draft || t.includes(draft.toLowerCase())))
    .slice(0, 6);

  function add(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/,/g, "");
    if (tag && !value.includes(tag) && value.length < 20) onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-field/50 px-3 py-1.5 transition-all",
          focused && "border-ring/60 bg-background",
        )}
      >
        <TagIcon className="size-4 text-subtitle" />
        {value.map((t) => (
          <span key={t} className="inline-flex animate-pop items-center gap-1 rounded-full bg-brand/10 py-0.5 pr-1 pl-2.5 text-sm text-brand">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="rounded-full p-0.5 hover:bg-brand/15" aria-label={`Remove ${t}`}>
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 120);
            if (draft) add(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={value.length ? "" : "Add tags: wordpress, shopify, urgent…"}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {focused && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 flex w-full animate-fade-in flex-wrap gap-1.5 rounded-lg border bg-popover p-2 shadow-md">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(s)}
              className="rounded-full border px-2.5 py-0.5 text-sm text-subtitle transition-colors hover:border-brand hover:text-brand"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
