"use client";

import { use } from "react";
import { FolderXIcon } from "lucide-react";
import { RequireRole } from "@/components/app/current-user";
import { EmptyState } from "@/components/empty-state";
import { ProjectForm } from "@/components/projects/project-form";
import { projectToForm } from "@/components/projects/project-schema";
import { useProject } from "@/lib/queries";

export function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, isPending, error } = useProject(id);

  return (
    <RequireRole roles={["admin", "operation"]}>
      {isPending ? (
        <div className="flex flex-col gap-6">
          <div className="skeleton-shimmer h-10 w-64 rounded-lg" />
          <div className="skeleton-shimmer h-72 rounded-xl" />
          <div className="skeleton-shimmer h-48 rounded-xl" />
        </div>
      ) : error || !project ? (
        <EmptyState icon={<FolderXIcon />} title="Project not found" description="It may have been deleted." />
      ) : (
        <ProjectForm key={project.id} project={project} initial={projectToForm(project)} />
      )}
    </RequireRole>
  );
}
