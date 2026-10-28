"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircleIcon, FileUpIcon, LockIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { envFileEnvironment, isSensitiveCredential, KIND_LABEL, parseEnvDetailed, planEnvImport, type EnvMergeMode, type ParsedEnvEntry } from "@/lib/credentials";
import type { Credential, CredentialKind, Environment } from "@/lib/types";
import { cn } from "@/lib/utils";

export type EnvImportTarget = { kind: "new"; title: string; environment: Environment } | { kind: "existing"; index: number; mode: EnvMergeMode };
const NEW = "__new__";
const MAX_FILE_SIZE = 1024 * 1024;
type ImportResource = { title: string; environment: Environment; credentials: Credential[] };
type Props = {
  open: boolean; onOpenChange: (open: boolean) => void; resources: ImportResource[]; defaultTarget?: number;
  onImport: (entries: ParsedEnvEntry[], target: EnvImportTarget) => void;
};
const ACTION_LABEL = { add: "New", fill: "Fill empty", replace: "Replace", keep: "Keep current", unchanged: "Unchanged" };

export function EnvImportDialog(props: Props) {
  return <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    {props.open && <ImportContent key={props.defaultTarget ?? NEW} {...props} />}
  </Dialog>;
}

function ImportContent({ resources, defaultTarget, onImport, onOpenChange }: Props) {
  const [text, setText] = useState("");
  const [target, setTarget] = useState(defaultTarget === undefined ? NEW : String(defaultTarget));
  const [title, setTitle] = useState("Environment variables");
  const [environment, setEnvironment] = useState<Environment>(resources[defaultTarget ?? -1]?.environment ?? "production");
  const [mode, setMode] = useState<EnvMergeMode>("keep");
  const [overrides, setOverrides] = useState<Record<string, CredentialKind>>({});
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [fileError, setFileError] = useState("");
  const [filename, setFilename] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const readVersion = useRef(0);
  const report = useMemo(() => parseEnvDetailed(text), [text]);
  const entries = useMemo(() => report.entries.map(e => ({ ...e, kind: overrides[e.label] ?? e.kind })), [report, overrides]);
  const selected = entries.filter(e => !excluded.has(e.label));
  const existing = target === NEW ? undefined : resources[Number(target)];
  const plan = planEnvImport(entries, existing?.credentials ?? [], mode);
  const selectedPlan = plan.filter(e => !excluded.has(e.label));
  const changes = selectedPlan.filter(e => e.action === "add" || e.action === "fill" || e.action === "replace");
  const addCount = changes.filter(e => e.action === "add").length;
  const updateCount = changes.length - addCount;
  const visible = plan.filter(e => e.label.toLowerCase().includes(query.toLowerCase()));
  const secrets = entries.filter(e => e.kind === "secret" || isSensitiveCredential(e.label, e.value)).length;
  const capacityError = target === NEW ? resources.length >= 100 : !!existing && existing.credentials.length + addCount > 100;
  const tooMany = selected.length > 100 || capacityError;
  const oversized = changes.some(entry => entry.label.length > 100 || entry.value.length > 20_000);
  const canImport = changes.length > 0 && !tooMany && !oversized && (target === NEW || !!existing) && (target !== NEW || !!title.trim());

  function setSource(source: string) {
    setText(source); setOverrides({}); setExcluded(new Set()); setFileError("");
  }
  async function onFile(file?: File) {
    if (!file) return;
    const version = ++readVersion.current;
    if (file.size > MAX_FILE_SIZE) { setFileError("Choose a text file smaller than 1 MB."); return; }
    try {
      const source = await file.text();
      if (version !== readVersion.current) return;
      if (source.includes("\0")) { setFileError("This file does not look like a text environment file."); return; }
      setSource(source); setFilename(file.name);
      const suggested = envFileEnvironment(file.name);
      if (suggested) setEnvironment(suggested);
      if (title === "Environment variables") setTitle(suggested ? `${suggested.charAt(0).toUpperCase() + suggested.slice(1)} environment` : file.name.slice(0, 120));
    } catch { setFileError("Could not read this file. Try pasting its contents instead."); }
  }
  function submit() {
    if (!canImport) return;
    // Pass only changes, so preserved and unchanged values are never rewritten.
    onImport(changes.map(({ label, value, kind }) => ({ label, value, kind })), target === NEW
      ? { kind: "new", title: title.trim(), environment }
      : { kind: "existing", index: Number(target), mode });
    onOpenChange(false);
  }

  return <DialogContent className="gap-4 sm:max-w-4xl" onKeyDown={e => e.stopPropagation()}>
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2"><FileUpIcon className="size-4 text-brand" />Import environment variables</DialogTitle>
      <DialogDescription>Paste or drop a .env file. Review detected fields and changes before adding them to this project.</DialogDescription>
    </DialogHeader>
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-1.5"><Label htmlFor="env-target" className="text-xs text-subtitle">Add to</Label><Combobox id="env-target" value={target} onValueChange={setTarget} searchPlaceholder="Search resources..." options={[{ value: NEW, label: "A new resource" }, ...resources.map((r, i) => ({ value: String(i), label: `${r.title || `Resource ${i + 1}`} (${r.environment})` }))]} /></div>
      {target === NEW ? <>
        <div className="flex min-w-0 flex-col gap-1.5"><Label htmlFor="env-title" className="text-xs text-subtitle">Resource name</Label><Input id="env-title" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} /></div>
        <div className="flex min-w-0 flex-col gap-1.5"><Label htmlFor="env-environment" className="text-xs text-subtitle">Environment</Label><Combobox id="env-environment" value={environment} onValueChange={v => setEnvironment(v as Environment)} searchPlaceholder="Search environments..." options={["production", "staging", "development"].map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))} /></div>
      </> : <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-1 lg:col-span-2"><Label htmlFor="env-conflicts" className="text-xs text-subtitle">When a key already has a value</Label><Combobox id="env-conflicts" value={mode} onValueChange={v => setMode(v as EnvMergeMode)} searchPlaceholder="Search import behavior..." options={[{ value: "keep", label: "Keep existing values; fill empty fields" }, { value: "replace", label: "Replace existing values with imported values" }]} /></div>}
    </div>
    <div className="grid min-w-0 gap-4 md:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-2" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void onFile(e.dataTransfer.files[0]); }}>
        <div className="flex items-center justify-between gap-2"><Label htmlFor="env-source">{filename || "File contents"}</Label><Button type="button" variant="outline" size="xs" onClick={() => fileRef.current?.click()}><FileUpIcon />Choose file</Button></div>
        <input ref={fileRef} type="file" aria-label="Choose an environment file" hidden onChange={e => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
        <Textarea id="env-source" value={text} maxLength={MAX_FILE_SIZE} onChange={e => { readVersion.current++; setSource(e.target.value); setFilename(""); }} placeholder={"DATABASE_URL=mongodb+srv://...\nJWT_SECRET=...\nPORT=5000\n\nDrop .env, .env.production, or .env.local here"} className="h-60 min-h-60 resize-none font-mono text-xs [field-sizing:fixed] md:h-72" spellCheck={false} autoComplete="off" />
        {fileError && <p role="alert" className="text-xs text-destructive">{fileError}</p>}
        <p className="text-xs text-subtitle">{entries.length} unique keys detected{secrets ? `, ${secrets} sensitive` : ""}. Values stay in this draft until the project is saved.</p>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2"><Label>Preview</Label>{entries.length > 0 && <Button type="button" size="xs" variant="ghost" onClick={() => setExcluded(selected.length === entries.length ? new Set(entries.map(e => e.label)) : new Set())}>{selected.length === entries.length ? "Deselect all" : "Select all"}</Button>}</div>
        <div className="overflow-hidden rounded-lg border">
          <div className="relative border-b"><SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-subtitle" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter keys..." aria-label="Filter environment keys" className="h-9 rounded-none border-0 bg-transparent pl-9 text-xs" /></div>
          <ul className="h-52 divide-y overflow-y-auto scrollbar-thin md:h-[250px]">
            {visible.length === 0 && <li className="px-4 py-8 text-center text-sm text-subtitle">{entries.length ? "No matching keys." : "Parsed fields will appear here."}</li>}
            {visible.map(entry => <li key={entry.label} className={cn("flex items-center gap-2 px-3 py-2", excluded.has(entry.label) && "opacity-50")}>
              <Checkbox aria-label={`Import ${entry.label}`} checked={!excluded.has(entry.label)} onCheckedChange={checked => setExcluded(old => { const next = new Set(old); if (checked === true) next.delete(entry.label); else next.add(entry.label); return next; })} />
              <div className="min-w-0 flex-1"><p className="truncate font-mono text-xs font-medium">{entry.label}</p><p className="truncate font-mono text-[11px] text-subtitle">{entry.kind === "secret" || isSensitiveCredential(entry.label, entry.value) ? "Sensitive value hidden" : entry.value || "(empty)"}</p><span className={cn("text-[10px] font-medium", entry.action === "replace" ? "text-warn-text" : entry.action === "add" || entry.action === "fill" ? "text-brand" : "text-subtitle")}>{ACTION_LABEL[entry.action]}</span></div>
              <Combobox value={entry.kind} onValueChange={v => setOverrides(old => ({ ...old, [entry.label]: v as CredentialKind }))} aria-label={`Type for ${entry.label}`} searchPlaceholder="Search field types..." size="sm" options={Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label }))} className="h-8 w-24 shrink-0 text-xs" icon={entry.kind === "secret" ? <LockIcon className="size-3" /> : undefined} />
            </li>)}
          </ul>
        </div>
      </div>
    </div>
    {report.warnings.length > 0 && <details className="rounded-lg border border-warn/30 bg-warn-soft/40 px-3 py-2 text-xs"><summary className="cursor-pointer font-medium text-warn-text">{report.warnings.length} parsing notice{report.warnings.length === 1 ? "" : "s"} - review before importing</summary><ul className="mt-2 max-h-24 space-y-1 overflow-auto">{report.warnings.map((warning, i) => <li key={i}>Line {warning.line}: {warning.message}</li>)}</ul></details>}
    {tooMany && <p role="alert" className="flex items-center gap-2 text-xs text-destructive"><AlertCircleIcon className="size-4" />A project supports up to 100 resources, with 100 fields per resource. Select fewer fields or a different resource.</p>}
    {oversized && <p role="alert" className="text-xs text-destructive">Selected field names must be at most 100 characters and values at most 20,000 characters. Deselect or shorten the oversized entries.</p>}
    <DialogFooter>
      <p className="mr-auto self-center text-xs text-subtitle">{addCount} new, {updateCount} updated{selectedPlan.length > changes.length ? `, ${selectedPlan.length - changes.length} kept` : ""}</p>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button type="button" onClick={submit} disabled={!canImport}><FileUpIcon />Import {changes.length} field{changes.length === 1 ? "" : "s"}</Button>
    </DialogFooter>
  </DialogContent>;
}
