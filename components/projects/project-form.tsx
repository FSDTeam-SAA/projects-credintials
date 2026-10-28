"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlarmClockIcon,
  CheckCircle2Icon,
  FileUpIcon,
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
  SaveIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCan } from "@/components/app/current-user";
import { FormRow } from "@/components/form-row";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import type { ParsedEnvEntry } from "@/lib/credentials";
import { applyServerErrors } from "@/lib/hooks";
import { useCategories, useProfileNames, useProjectMeta } from "@/lib/queries";
import type { Project, ResourceTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EnvImportDialog, type EnvImportTarget } from "./env-import-dialog";
import { emptyProject, projectSchema, type ProjectFormValues, type ResourceFormValues } from "./project-schema";
import { ResourceEditor } from "./resource-editor";
import { ResourceIcon } from "./resource-icon";
import { TagInput } from "./tag-input";
import { TemplatePicker } from "./template-picker";

const POPULAR = ["vps", "domain", "mongodb", "cloudinary", "github", "app-store", "figma", "website-admin"];

export function ProjectForm({ project, initial }: { project?: Project; initial?: ProjectFormValues }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const can = useCan();
  const { data: meta } = useProjectMeta();
  const { data: categories = [] } = useCategories();
  const { data: profiles = [] } = useProfileNames();

  const isEdit = !!project;
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initial ?? emptyProject,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  const { fields, append, remove, move, insert } = useFieldArray({ control, name: "resources", keyName: "_key" });
  const resources = useWatch({ control, name: "resources" });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const [envTarget, setEnvTarget] = useState<number | undefined>();
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const savedRef = useRef(false);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !savedRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Ctrl/Cmd + S saves.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit(onSubmit, onInvalid)();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function scrollToResource(index: number) {
    requestAnimationFrame(() => {
      document.getElementById(`resource-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function addResource(r: ResourceFormValues) {
    const index = fields.length;
    append(r);
    setFreshKey(String(index));
    scrollToResource(index);
  }

  function addFromTemplate(t: ResourceTemplate) {
    addResource({
      title: t.label === "Custom" ? "" : t.label,
      type: t.type,
      template: t.key,
      environment: "production",
      url: "",
      notes: "",
      expiresAt: null,
      credentials: t.fields.map((f) => ({ label: f.label, value: "", kind: f.kind })),
    });
  }

  function importEnv(entries: ParsedEnvEntry[], target: EnvImportTarget) {
    const creds = entries.map((e) => ({ label: e.label, value: e.value, kind: e.kind }));
    if (target.kind === "new") {
      addResource({
        title: target.title,
        type: "Other",
        template: "env",
        environment: target.environment,
        url: "",
        notes: "",
        expiresAt: null,
        credentials: creds,
      });
    } else {
      const path = `resources.${target.index}.credentials` as const;
      const existing = getValues(path);
      // Update values for keys that already exist, append the rest.
      const byLabel = new Map(existing.map((c, i) => [c.label.toLowerCase(), i]));
      const merged = [...existing];
      for (const c of creds) {
        const i = byLabel.get(c.label.toLowerCase());
        if (i !== undefined) merged[i] = { ...merged[i]!, value: c.value };
        else merged.push(c);
      }
      setValue(path, merged, { shouldDirty: true });
      scrollToResource(target.index);
    }
    toast.success(`Imported ${entries.length} value${entries.length === 1 ? "" : "s"}`);
  }

  async function onSubmit(values: ProjectFormValues) {
    try {
      const saved = isEdit
        ? await api.put<{ project: Project }>(`/projects/${project.id}`, values)
        : await api.post<{ project: Project }>("/projects", values);
      savedRef.current = true;
      queryClient.setQueryData(["projects", "detail", saved.project.id], saved.project);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["profile-names"] });
      reset(values);
      toast.success(isEdit ? "Project updated" : "Project created", {
        description: `${values.resources.length} resource${values.resources.length === 1 ? "" : "s"} saved and encrypted.`,
      });
      router.push(`/projects/${saved.project.id}`);
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  function onInvalid() {
    toast.error("Please fix the highlighted fields");
    const firstBad = errors.resources ? Object.keys(errors.resources).find((k) => /^\d+$/.test(k)) : undefined;
    if (firstBad !== undefined) scrollToResource(Number(firstBad));
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!meta) return <FormSkeleton />;

  const totalFields = resources.reduce((n, r) => n + r.credentials.length, 0);
  const secretCount = resources.reduce((n, r) => n + r.credentials.filter((c) => c.kind === "secret").length, 0);
  const missingExpiry = resources.filter((r) => meta.templates.find((t) => t.key === r.template)?.hasExpiry && !r.expiresAt).length;
  const emptyValues = resources.reduce((n, r) => n + r.credentials.filter((c) => c.label && !c.value).length, 0);
  const noLookups = !categories.length || !profiles.length;

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="flex flex-col gap-6 pb-28">
      <PageHeader
        back
        title={isEdit ? "Edit Project" : "Add Project"}
        description={isEdit ? "View and edit the project information quickly." : "Store everything needed to access and deploy this project."}
      />

      {noLookups && (
        <div className="flex animate-fade-up flex-wrap items-center justify-between gap-3 rounded-xl border border-warn bg-warn-soft px-4 py-3 text-sm">
          <span>
            {!categories.length && "No categories exist yet. "}
            {!profiles.length && "No profile names exist yet. "}
            {can.manageLookups ? "Add them first so projects can be classified." : "Ask an admin to add them."}
          </span>
          {can.manageLookups && (
            <div className="flex gap-2">
              {!categories.length && (
                <Button asChild size="sm" variant="outline-warn">
                  <Link href="/categories">Add category</Link>
                </Button>
              )}
              {!profiles.length && (
                <Button asChild size="sm" variant="outline-warn">
                  <Link href="/profile-names">Add profile name</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Project information */}
          <section className="animate-fade-up rounded-xl border bg-card p-4 shadow-surface md:p-5">
            <h2 className="mb-4 text-xl font-medium text-title">Project Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormRow label="Client name" htmlFor="clientName" required error={errors.clientName?.message} labelClassName="text-sm">
                <Input id="clientName" placeholder="e.g. giveandtake638" autoFocus={!isEdit} aria-invalid={!!errors.clientName} {...register("clientName")} />
              </FormRow>
              <FormRow label="Profile name" htmlFor="profileName" required error={errors.profileName?.message} labelClassName="text-sm">
                <Controller
                  control={control}
                  name="profileName"
                  render={({ field }) => (
                    <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="profileName" ref={field.ref} onBlur={field.onBlur} className="w-full" aria-invalid={!!errors.profileName}>
                        <SelectValue placeholder="Select profile name" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormRow>
              <FormRow label="Category" htmlFor="category" required error={errors.category?.message} labelClassName="text-sm">
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="category" ref={field.ref} onBlur={field.onBlur} className="w-full" aria-invalid={!!errors.category}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormRow>
              <FormRow label="Service line" htmlFor="serviceLine" required error={errors.serviceLine?.message} labelClassName="text-sm">
                <Controller
                  control={control}
                  name="serviceLine"
                  render={({ field }) => (
                    <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="serviceLine" ref={field.ref} onBlur={field.onBlur} className="w-full" aria-invalid={!!errors.serviceLine}>
                        <SelectValue placeholder="Select service line" />
                      </SelectTrigger>
                      <SelectContent>
                        {meta.serviceLines.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormRow>
              <FormRow label="Live site URL" htmlFor="liveUrl" error={errors.liveUrl?.message} labelClassName="text-sm">
                <Input id="liveUrl" placeholder="https://www.client-site.com" {...register("liveUrl")} />
              </FormRow>
              <FormRow label="Repository URL" htmlFor="repoUrl" error={errors.repoUrl?.message} labelClassName="text-sm">
                <Input id="repoUrl" placeholder="https://github.com/org/repo" {...register("repoUrl")} />
              </FormRow>
              <FormRow label="Tags" className="md:col-span-2" labelClassName="text-sm">
                <Controller control={control} name="tags" render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />} />
              </FormRow>
              <FormRow label="Project notes" htmlFor="notes" className="md:col-span-2" labelClassName="text-sm" hint="Encrypted like credentials.">
                <Textarea id="notes" placeholder="Deployment steps, client contacts, gotchas…" {...register("notes")} />
              </FormRow>
            </div>
          </section>

          {/* Resources */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-medium text-title md:text-2xl">Resources &amp; Access</h2>
                <p className="text-sm text-subtitle">Servers, accounts, keys and links for this project.</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline-warn" size="pill" onClick={() => { setEnvTarget(undefined); setEnvOpen(true); }}>
                  <FileUpIcon /> Import .env
                </Button>
                <Button type="button" size="pill" className="group" onClick={() => setPickerOpen(true)}>
                  <PlusIcon className="transition-transform group-hover:rotate-90" /> Add New
                </Button>
              </div>
            </div>

            {fields.length === 0 ? (
              <div className="animate-fade-up rounded-xl border border-dashed border-warn/70 bg-warn-soft/30 p-5">
                <p className="mb-4 text-sm font-medium text-title">Quick start — what does this project use?</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {POPULAR.map((key, i) => {
                    const t = meta.templates.find((x) => x.key === key);
                    if (!t) return null;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => addFromTemplate(t)}
                        style={{ "--i": i } as React.CSSProperties}
                        className="stagger flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
                      >
                        <ResourceIcon template={t.key} type={t.type} />
                        <span className="text-sm font-medium text-title">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <Button type="button" variant="link" className="h-auto p-0" onClick={() => setPickerOpen(true)}>
                    Browse all {meta.templates.length} templates →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {fields.map((f, index) => (
                  <ResourceEditor
                    key={f._key}
                    index={index}
                    total={fields.length}
                    control={control}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    errors={errors.resources}
                    meta={meta}
                    isNew={freshKey === String(index)}
                    onRemove={() => {
                      const removed = getValues(`resources.${index}`);
                      remove(index);
                      toast("Resource removed", {
                        description: removed.title || undefined,
                        action: { label: "Undo", onClick: () => insert(index, removed) },
                      });
                    }}
                    onDuplicate={() => {
                      const copy = structuredClone(getValues(`resources.${index}`));
                      insert(index + 1, { ...copy, title: `${copy.title} (copy)` });
                      setFreshKey(String(index + 1));
                      scrollToResource(index + 1);
                    }}
                    onMove={(dir) => {
                      move(index, index + dir);
                      scrollToResource(index + dir);
                    }}
                    onImportEnv={() => {
                      setEnvTarget(index);
                      setEnvOpen(true);
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="group flex items-center justify-center gap-2 rounded-xl border border-dashed border-warn/70 py-4 text-sm font-medium text-subtitle transition-all hover:border-brand hover:bg-brand-soft/40 hover:text-brand"
                >
                  <PlusIcon className="size-4 transition-transform group-hover:rotate-90" /> Add another resource
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Outline / checklist */}
        <aside className="sticky top-24 hidden animate-fade-up flex-col gap-4 [animation-delay:120ms] xl:flex">
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-title">Outline</p>
            {resources.length === 0 ? (
              <p className="text-sm text-subtitle">Resources you add will be listed here.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {resources.map((r, i) => (
                  <li key={fields[i]?._key ?? i}>
                    <button
                      type="button"
                      onClick={() => scrollToResource(i)}
                      className="flex w-full items-center gap-2 rounded-md p-1.5 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <ResourceIcon template={r.template} type={r.type} size="sm" />
                      <span className={cn("flex-1 truncate", !r.title && "text-muted-foreground italic")}>{r.title || "Untitled"}</span>
                      <span className="text-xs text-subtitle">{r.credentials.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-sm font-semibold text-title">Checklist</p>
            <ul className="flex flex-col gap-2.5 text-sm">
              <Check ok icon={<KeyRoundIcon />} text={`${totalFields} field${totalFields === 1 ? "" : "s"} across ${resources.length} resource${resources.length === 1 ? "" : "s"}`} />
              <Check ok icon={<LockIcon />} text={`${secretCount} secret${secretCount === 1 ? "" : "s"} detected`} />
              <Check ok={emptyValues === 0} icon={<CheckCircle2Icon />} text={emptyValues ? `${emptyValues} field${emptyValues === 1 ? " is" : "s are"} still empty` : "No empty fields"} />
              <Check ok={missingExpiry === 0} icon={<AlarmClockIcon />} text={missingExpiry ? `${missingExpiry} resource${missingExpiry === 1 ? "" : "s"} without a renewal date` : "Renewal dates set"} />
            </ul>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-soft p-2.5 text-xs text-accent-foreground">
              <ShieldCheckIcon className="mt-px size-4 shrink-0" /> Every value and note is encrypted with AES-256 before it&apos;s saved.
            </p>
          </div>
        </aside>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur lg:left-(--sidebar-w)">
        <div className="mx-auto flex max-w-[1580px] items-center justify-between gap-3 px-4 py-3 md:px-8">
          <p className="flex items-center gap-2 text-sm text-subtitle">
            <span className={cn("size-2 rounded-full transition-colors", isDirty ? "animate-pulse bg-warn" : "bg-brand")} />
            {isDirty ? "Unsaved changes" : "All changes saved"}
            <kbd className="ml-2 hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] md:inline">Ctrl S</kbd>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline-warn" className="h-11 w-28 md:w-[160px]" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="h-11 w-28 md:w-[200px]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </div>

      <TemplatePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        templates={meta.templates}
        onPick={addFromTemplate}
        onImportEnv={() => {
          setEnvTarget(undefined);
          setTimeout(() => setEnvOpen(true), 150);
        }}
      />
      <EnvImportDialog open={envOpen} onOpenChange={setEnvOpen} resources={resources} defaultTarget={envTarget} onImport={importEnv} />
    </form>
  );
}

function Check({ ok, icon, text }: { ok: boolean; icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full transition-colors [&_svg]:size-3.5", ok ? "bg-brand-soft text-brand" : "bg-warn-soft text-warn-text")}>
        {icon}
      </span>
      <span className={cn(ok ? "text-title" : "text-warn-text")}>{text}</span>
    </li>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton-shimmer h-10 w-64 rounded-lg" />
      <div className="skeleton-shimmer h-72 rounded-xl" />
      <div className="skeleton-shimmer h-48 rounded-xl" />
    </div>
  );
}
