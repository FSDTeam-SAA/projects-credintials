"use client";

import { RequireRole } from "@/components/app/current-user";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <RequireRole roles={["admin", "operation"]}>
      <ProjectForm />
    </RequireRole>
  );
}
