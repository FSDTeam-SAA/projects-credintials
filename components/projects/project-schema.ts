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

export const projectSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required"),
  profileName: z.string().min(1, "Select a profile name"),
  category: z.string().min(1, "Select a category"),
  serviceLine: z.string().min(1, "Select a service line"),
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  tags: z.array(z.string()),
  notes: z.string(),
  resources: z.array(resourceSchema),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type ResourceFormValues = z.infer<typeof resourceSchema>;

export const emptyProject: ProjectFormValues = {
  clientName: "",
  profileName: "",
  category: "",
  serviceLine: "",
  liveUrl: "",
  repoUrl: "",
  tags: [],
  notes: "",
  resources: [],
};

export function projectToForm(p: Project): ProjectFormValues {
  return {
    clientName: p.clientName,
    profileName: p.profileName?.id ?? "",
    category: p.category?.id ?? "",
    serviceLine: p.serviceLine,
    liveUrl: p.liveUrl,
    repoUrl: p.repoUrl,
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
