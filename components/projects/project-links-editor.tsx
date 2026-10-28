"use client";

import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { GitBranchIcon, GlobeIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormRow } from "@/components/form-row";
import type { ProjectFormValues } from "./project-schema";

export function ProjectLinksEditor({ name, control, register, errors }: { name: "liveSites" | "repositories"; control: Control<ProjectFormValues>; register: UseFormRegister<ProjectFormValues>; errors: FieldErrors<ProjectFormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const sites = name === "liveSites";
  const Icon = sites ? GlobeIcon : GitBranchIcon;
  return <section className="@container/links flex min-w-0 flex-col gap-3 rounded-xl border bg-background/40 p-3 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-brand" />{sites ? "Live sites" : "Repositories"}<span className="text-subtitle">({fields.length})</span></h3><Button type="button" variant="outline" size="sm" disabled={fields.length >= 100} onClick={() => append({ label: "", url: "" })}><PlusIcon />{sites ? "Add live site" : "Add repository"}</Button></div>
    {fields.length === 0 && <p className="text-sm text-subtitle">{sites ? "Add your website, admin dashboard, rider portal, and other live panels." : "Add frontend, backend, mobile app, and other code repositories."}</p>}
    {errors[name]?.root?.message && <p role="alert" className="text-sm text-destructive">{errors[name].root.message}</p>}
    {fields.map((field, i) => <div key={field.id} className="flex min-w-0 items-start gap-2 rounded-lg border bg-card p-3">
      <div className="grid min-w-0 flex-1 gap-3 @xl/links:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <FormRow label="Label" htmlFor={`${name}-${i}-label`} labelClassName="text-xs" error={errors[name]?.[i]?.label?.message}><Input id={`${name}-${i}-label`} className="h-10" placeholder={sites ? "e.g. Admin dashboard" : "e.g. Backend"} aria-invalid={!!errors[name]?.[i]?.label} {...register(`${name}.${i}.label`)} /></FormRow>
      <FormRow label="URL" htmlFor={`${name}-${i}-url`} labelClassName="text-xs" error={errors[name]?.[i]?.url?.message}><Input id={`${name}-${i}-url`} className="h-10" inputMode="url" placeholder={sites ? "https://admin.example.com" : "https://github.com/org/backend"} aria-invalid={!!errors[name]?.[i]?.url} {...register(`${name}.${i}.url`)} /></FormRow>
      </div>
      <Button type="button" variant="ghost" size="icon" className="mt-6 shrink-0 text-subtitle hover:text-destructive" aria-label={`Remove ${sites ? "live site" : "repository"} ${i + 1}`} onClick={() => remove(i)}><Trash2Icon /></Button>
    </div>)}
  </section>;
}
