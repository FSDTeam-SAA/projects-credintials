"use client";

import { useMemo, useRef, useState } from "react";
import { FileUpIcon, LockIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { KIND_LABEL, parseEnv, type ParsedEnvEntry } from "@/lib/credentials";
import type { CredentialKind, Environment } from "@/lib/types";
import { cn } from "@/lib/utils";

export type EnvImportTarget = { kind: "new"; title: string; environment: Environment } | { kind: "existing"; index: number };

const NEW = "__new__";

/**
 * Paste or upload a .env file, preview how each line will be stored (secret detection),
 * then add it as a new resource or merge into an existing one.
 */
export function EnvImportDialog({
  open,
  onOpenChange,
  resources,
  defaultTarget,
  onImport,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  resources: { title: string }[];
  defaultTarget?: number;
  onImport: (entries: ParsedEnvEntry[], target: EnvImportTarget) => void;
}) {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<string>(NEW);
  const [title, setTitle] = useState("Environment variables");
  const [environment, setEnvironment] = useState<Environment>("production");
  const [overrides, setOverrides] = useState<Record<number, CredentialKind>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const entries = useMemo(() => parseEnv(text).map((e, i) => ({ ...e, kind: overrides[i] ?? e.kind })), [text, overrides]);
  const secrets = entries.filter((e) => e.kind === "secret").length;

  function reset() {
    setText("");
    setOverrides({});
    setTarget(NEW);
    setTitle("Environment variables");
  }

  function handleOpenChange(o: boolean) {
    if (o) setTarget(defaultTarget !== undefined ? String(defaultTarget) : NEW);
    else reset();
    onOpenChange(o);
  }

  async function onFile(file?: File) {
    if (!file) return;
    setText(await file.text());
    setOverrides({});
    if (target === NEW && title === "Environment variables") setTitle(file.name);
  }

  function submit() {
    onImport(
      entries,
      target === NEW ? { kind: "new", title: title.trim() || "Environment variables", environment } : { kind: "existing", index: Number(target) },
    );
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <SparklesIcon className="size-5 text-warn" /> Import from .env
          </DialogTitle>
          <DialogDescription>Paste the file contents or upload it. Passwords, keys and tokens are detected automatically.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <div
            className="flex flex-col gap-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files[0]);
            }}
          >
            <div className="flex items-center justify-between">
              <Label>File contents</Label>
              <Button type="button" variant="ghost" size="xs" onClick={() => fileRef.current?.click()}>
                <FileUpIcon /> Upload file
              </Button>
              <input ref={fileRef} type="file" accept=".env,.txt,text/plain" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <Textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setOverrides({});
              }}
              placeholder={"DATABASE_URL=mongodb+srv://...\nJWT_SECRET=...\nSTRIPE_SECRET_KEY=sk_live_...\n\n(or drop a .env file here)"}
              className="h-36 resize-none font-mono text-xs md:h-64"
              spellCheck={false}
            />
          </div>

          <div className="flex min-h-0 flex-col gap-2">
            <Label>
              Preview{" "}
              {entries.length > 0 && (
                <span className="font-normal text-subtitle">
                  · {entries.length} values, {secrets} secret{secrets === 1 ? "" : "s"}
                </span>
              )}
            </Label>
            <div className="h-40 overflow-y-auto rounded-lg border scrollbar-thin md:h-64">
              {entries.length === 0 ? (
                <p className="p-4 text-sm text-subtitle">Parsed values will appear here.</p>
              ) : (
                <ul className="divide-y">
                  {entries.map((e, i) => (
                    <li key={i} style={{ "--i": Math.min(i, 12) } as React.CSSProperties} className="stagger flex items-center gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-medium text-title">{e.label}</p>
                        <p className={cn("truncate font-mono text-xs text-subtitle", e.kind === "secret" && "blur-[3px]")}>{e.value || "(empty)"}</p>
                      </div>
                      <Select value={e.kind} onValueChange={(v) => setOverrides((o) => ({ ...o, [i]: v as CredentialKind }))}>
                        <SelectTrigger size="sm" className={cn("h-7! w-[110px] text-xs", e.kind === "secret" && "border-warn bg-warn-soft")}>
                          {e.kind === "secret" && <LockIcon className="size-3!" />}
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(KIND_LABEL) as CredentialKind[]).map((k) => (
                            <SelectItem key={k} value={k}>
                              {KIND_LABEL[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg bg-muted/60 p-3 md:grid-cols-[1fr_1fr_160px]">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-subtitle">Add to</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="h-10! w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NEW}>A new resource</SelectItem>
                {resources.map((r, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {r.title || `Resource ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {target === NEW && (
            <>
              <div className="flex animate-fade-in flex-col gap-1.5">
                <Label className="text-xs text-subtitle">Resource name</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 bg-background" />
              </div>
              <div className="flex animate-fade-in flex-col gap-1.5">
                <Label className="text-xs text-subtitle">Environment</Label>
                <Select value={environment} onValueChange={(v) => setEnvironment(v as Environment)}>
                  <SelectTrigger className="h-10! w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["production", "staging", "development"] as const).map((e) => (
                      <SelectItem key={e} value={e} className="capitalize">
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline-warn" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!entries.length}>
            Import {entries.length || ""} value{entries.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
