import { Suspense } from "react";
import { ProjectDetails } from "./project-details";

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense>
      <ProjectDetails params={params} />
    </Suspense>
  );
}
