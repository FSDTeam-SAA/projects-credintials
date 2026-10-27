"use client";

import { TagIcon } from "lucide-react";
import { RequireRole } from "@/components/app/current-user";
import { LookupManager } from "@/components/lookup-manager";

export default function CategoriesPage() {
  return (
    <RequireRole roles={["admin"]}>
      <LookupManager
        config={{
          endpoint: "/categories",
          queryKey: "categories",
          title: "Add Category name",
          description: "Add the categories used to classify and filter projects.",
          listTitle: "All category",
          singular: "Category name",
          placeholder: "E-commerce",
          addLabel: "Add Category",
          icon: <TagIcon />,
        }}
      />
    </RequireRole>
  );
}
