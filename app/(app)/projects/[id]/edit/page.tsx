import { Suspense } from "react";
import { EditProject } from "./edit-project";

export default function EditProjectPage({ params }: PageProps<"/projects/[id]/edit">) {
  return (
    <Suspense>
      <EditProject params={params} />
    </Suspense>
  );
}
