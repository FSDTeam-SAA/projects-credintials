"use client";

import { useState } from "react";
import { Controller, useFieldArray, useWatch, type Control, type UseFormRegister, type FieldErrors, type UseFormSetValue, type UseFormGetValues } from "react-hook-form";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  CopyPlusIcon,
  ExternalLinkIcon,
  FileDownIcon,
  FileUpIcon,
  GripVerticalIcon,
  LockIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
  WandSparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CopyButton, copyText } from "@/components/copy-button";
import { EnvBadge } from "@/components/badges";
import { KIND_LABEL, QUICK_FIELDS, detectKind, generatePassword, toEnv } from "@/lib/credentials";
import type { CredentialKind, Environment, ProjectMeta } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExpiryPicker } from "./date-picker";
import type { ProjectFormValues } from "./project-schema";
import { ResourceIcon } from "./resource-icon";

type Props = {
  index: number;
  total: number;
  control: Control<ProjectFormValues>;
  register: UseFormRegister<ProjectFormValues>;
  setValue: UseFormSetValue<ProjectFormValues>;
  getValues: UseFormGetValues<ProjectFormValues>;
  errors?: FieldErrors<ProjectFormValues>["resources"];
  meta: ProjectMeta;
  isNew?: boolean;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (dir: -1 | 1) => void;
  onImportEnv: () => void;
};

export function ResourceEditor({
  index,
  total,
  control,
  register,
  setValue,
  getValues,
  errors,
  meta,
  isNew,
  onRemove,
  onDuplicate,
  onMove,
  onImportEnv,
}: Props) {
  const [open, setOpen] = useState(true);
  const base = `resources.${index}` as const;
  const { fields, append, remove } = useFieldArray({ control, name: `${base}.credentials` });
  const [template, type, url, environment] = useWatch({
    control,
    name: [`${base}.template`, `${base}.type`, `${base}.url`, `${base}.environment`],
  });
  const resourceErrors = errors?.[index];
  const tpl = meta.templates.find((t) => t.key === template);
  const credCount = fields.length;

  function exportEnv() {
    const env = toEnv(getValues(`${base}.credentials`));
    if (!env) return toast.info("Nothing to export yet");
    copyText(env, ".env copied to clipboard");
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      id={`resource-${index}`}
      className={cn(
        "group/resource scroll-mt-24 rounded-xl border border-warn/70 bg-card transition-shadow duration-300 hover:shadow-surface-hover",
        isNew && "animate-pop",
        resourceErrors && "border-destructive/60",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 pl-2 md:gap-3">
        <GripVerticalIcon className="size-4 shrink-0 text-muted-foreground/50" />
        <ResourceIcon template={template} type={type} size="lg" />
        <div className="min-w-0 flex-1">
          <input
            {...register(`${base}.title`)}
            placeholder="Resource name, e.g. Hostinger VPS"
            className={cn(
              "w-full rounded-md bg-transparent px-1.5 py-0.5 text-base font-semibold md:text-lg text-title outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground hover:bg-muted/60 focus:bg-muted/60",
              resourceErrors?.title && "placeholder:text-destructive/70",
            )}
          />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1.5 text-xs text-subtitle">
            <span>{tpl?.label ?? type}</span>
            <span>·</span>
            <span>
              {credCount} field{credCount === 1 ? "" : "s"}
            </span>
            {!open && <EnvBadge env={environment as Environment} className="ml-1" />}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Controller
            control={control}
            name={`${base}.environment`}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger size="sm" className="h-8! w-[130px] border-border capitalize hover:border-warn/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meta.environments.map((e) => (
                    <SelectItem key={e} value={e} className="capitalize">
                      <EnvBadge env={e} className="bg-transparent px-0" />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Controller
            control={control}
            name={`${base}.type`}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger size="sm" className="h-8! w-[150px] border-border hover:border-warn/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meta.resourceTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {url && (
          <Button asChild type="button" variant="outline" size="sm" className="hidden border-warn text-brand sm:inline-flex">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLinkIcon /> Open Link
            </a>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Resource actions">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={onDuplicate}>
              <CopyPlusIcon /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onImportEnv}>
              <FileUpIcon /> Import .env into this
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={exportEnv}>
              <FileDownIcon /> Copy as .env
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(-1)}>
              <ArrowUpIcon /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={index === total - 1} onSelect={() => onMove(1)}>
              <ArrowDownIcon /> Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2Icon /> Remove resource
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={open ? "Collapse" : "Expand"}>
            <ChevronDownIcon className={cn("transition-transform duration-300", !open && "-rotate-90")} />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="flex flex-col gap-5 border-t border-dashed border-warn/50 p-4 md:p-5">
          {/* mobile-only selects */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            <Controller
              control={control}
              name={`${base}.environment`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.environments.map((e) => (
                      <SelectItem key={e} value={e} className="capitalize">
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              control={control}
              name={`${base}.type`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.resourceTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {resourceErrors?.title && <p className="-mt-2 text-sm text-destructive">{resourceErrors.title.message}</p>}

          <div className="grid gap-4 md:grid-cols-[1fr_300px]">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Login / dashboard URL</span>
              <div className="relative">
                <Input {...register(`${base}.url`)} placeholder={tpl?.urlPlaceholder ?? "https://"} className="pr-10" />
                {url && /^https?:\/\//.test(url) && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-1/2 right-3 -translate-y-1/2 animate-pop text-subtitle hover:text-brand"
                    aria-label="Open link"
                  >
                    <ExternalLinkIcon className="size-4" />
                  </a>
                )}
              </div>
              {resourceErrors?.url && <p className="text-sm text-destructive">{resourceErrors.url.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Renewal / expiry date {tpl?.hasExpiry && <span className="text-xs font-normal text-warn">recommended</span>}
              </span>
              <Controller
                control={control}
                name={`${base}.expiresAt`}
                render={({ field }) => <ExpiryPicker value={field.value} onChange={field.onChange} />}
              />
            </div>
          </div>

          {/* Credentials */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-title">Credential</span>
              <span className="text-xs text-subtitle">Values are encrypted before they&apos;re stored</span>
            </div>

            {fields.length === 0 && (
              <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-subtitle">
                No fields yet. Add one below or import a .env file.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {fields.map((f, ci) => (
                <CredentialRow
                  key={f.id}
                  name={`${base}.credentials.${ci}`}
                  control={control}
                  register={register}
                  setValue={setValue}
                  getValues={getValues}
                  error={resourceErrors?.credentials?.[ci]?.label?.message}
                  onRemove={() => remove(ci)}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Button type="button" variant="soft" size="sm" onClick={() => append({ label: "", value: "", kind: "text" })}>
                <PlusIcon /> Add field
              </Button>
              <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
              {QUICK_FIELDS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => append({ label: q.label, value: "", kind: q.kind })}
                  className="rounded-full border border-dashed px-2.5 py-1 text-xs text-subtitle transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand"
                >
                  + {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-title">Note</span>
            <Textarea {...register(`${base}.notes`)} placeholder="Anything the next person should know: who owns DNS, 2FA device, renewal account…" className="min-h-24" />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CredentialRow({
  name,
  control,
  register,
  setValue,
  getValues,
  error,
  onRemove,
}: {
  name: `resources.${number}.credentials.${number}`;
  control: Control<ProjectFormValues>;
  register: UseFormRegister<ProjectFormValues>;
  setValue: UseFormSetValue<ProjectFormValues>;
  getValues: UseFormGetValues<ProjectFormValues>;
  error?: string;
  onRemove: () => void;
}) {
  const [kind, value] = useWatch({ control, name: [`${name}.kind`, `${name}.value`] });
  const labelField = register(`${name}.label`);

  return (
    <div className="group/row grid animate-fade-up grid-cols-[1fr_auto] items-start gap-2 rounded-lg p-1 transition-colors [grid-template-areas:'label_kind'_'value_actions'] hover:bg-muted/40 max-md:border max-md:border-dashed max-md:p-2 md:grid-cols-[minmax(140px,220px)_1fr_120px_auto] md:[grid-template-areas:'label_value_kind_actions']">
      <div className="min-w-0 [grid-area:label]">
        <Input
          {...labelField}
          onBlur={(e) => {
            labelField.onBlur(e);
            // Smart default: "API Secret" becomes a secret, "Login URL" a link…
            const current = getValues(`${name}.kind`);
            if (current === "text") {
              const guess = detectKind(e.target.value, getValues(`${name}.value`));
              if (guess !== "text") setValue(`${name}.kind`, guess, { shouldDirty: true });
            }
          }}
          placeholder="Field name"
          aria-invalid={!!error}
          className="h-10 font-medium"
        />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>

      <div className="relative min-w-0 [grid-area:value]">
        {kind === "multiline" ? (
          <Textarea {...register(`${name}.value`)} placeholder="Paste key / certificate / JSON…" className="min-h-24 font-mono text-xs" spellCheck={false} />
        ) : (
          <>
            {kind === "secret" && <LockIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-warn" />}
            <Input
              {...register(`${name}.value`)}
              type={kind === "email" ? "email" : "text"}
              placeholder={kind === "url" ? "https://" : kind === "secret" ? "Secret value" : "Value"}
              autoComplete="off"
              spellCheck={false}
              className={cn("h-10", kind === "secret" && "pl-8 font-mono text-[13px]", kind === "secret" && "pr-10")}
            />
            {kind === "secret" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setValue(`${name}.value`, generatePassword(), { shouldDirty: true })}
                    className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-subtitle transition-all hover:rotate-12 hover:bg-warn-soft hover:text-warn-text"
                    aria-label="Generate strong password"
                  >
                    <WandSparklesIcon className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Generate a strong password</TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </div>

      <div className="w-[104px] [grid-area:kind] md:w-auto">
        <Controller
          control={control}
          name={`${name}.kind`}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(v) => field.onChange(v as CredentialKind)}>
              <SelectTrigger className={cn("h-10! w-full border-border text-sm", field.value === "secret" && "border-warn/70 bg-warn-soft/60")}>
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
          )}
        />
      </div>

      <div className="flex items-center gap-0.5 pt-0.5 [grid-area:actions]">
        <CopyButton value={value ?? ""} />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="text-muted-foreground opacity-60 transition-opacity group-hover/row:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remove field"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}
