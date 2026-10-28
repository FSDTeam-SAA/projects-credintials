import { z } from "zod";
import type { Project } from "@/lib/types";

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), "Must start with http:// or https://");

export const credentialSchema = z.object({
  label: z.string().trim().min(1, "Field name is required"),
  value: z.string(),
  kind: z.enum(["text", "secret", "url", "email", "multiline"]),
});

export const resourceSchema = z.object({
  title: z.string().trim().min(1, "Give this resource a name"),
  type: z.string(),
  template: z.string().nullable().optional(),
  environment: z.enum(["production", "staging", "development"]),
  url: optionalUrl,
  notes: z.string(),
  expiresAt: z.string().nullable(),
  credentials: z.array(credentialSchema),
});

export const projectLinkSchema = z.object({
  label: z.string().trim().max(120),
  url: z.string().trim().max(2048),
}).superRefine((v, ctx) => {
  if (!v.label && !v.url) return;
  if (!v.label) ctx.addIssue({ code: "custom", path: ["label"], message: "Link label is required" });
  let valid = false;
  try { const url = new URL(v.url); valid = ["http:", "https:"].includes(url.protocol) && !!url.hostname; } catch {}
  if (!valid) ctx.addIssue({ code: "custom", path: ["url"], message: "Enter an http:// or https:// URL" });
});

export const projectSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  name: z.string().trim().min(1, "Project name is required").max(120),
  profileName: z.string().min(1, "Select a profile name"),
  category: z.string().min(1, "Select a category"),
  serviceLine: z.string().min(1, "Select a service line"),
  liveSites: z.array(projectLinkSchema).max(100),
  repositories: z.array(projectLinkSchema).max(100),
  tags: z.array(z.string()),
  notes: z.string(),
  resources: z.array(resourceSchema),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type ResourceFormValues = z.infer<typeof resourceSchema>;

export const emptyProject: ProjectFormValues = {
  clientId: "",
  name: "",
  profileName: "",
  category: "",
  serviceLine: "",
  liveSites: [],
  repositories: [],
  tags: [],
  notes: "",
  resources: [],
};

export function projectToForm(p: Project): ProjectFormValues {
  return {
    clientId: p.client?.id ?? "",
    name: p.name,
    profileName: p.profileName?.id ?? "",
    category: p.category?.id ?? "",
    serviceLine: p.serviceLine,
    liveSites: p.liveSites,
    repositories: p.repositories,
    tags: p.tags,
    notes: p.notes,
    resources: p.resources.map((r) => ({
      title: r.title,
      type: r.type,
      template: r.template ?? null,
      environment: r.environment,
      url: r.url,
      notes: r.notes,
      expiresAt: r.expiresAt,
      credentials: r.credentials.map((c) => ({ label: c.label, value: c.value, kind: c.kind })),
    })),
  };
}
