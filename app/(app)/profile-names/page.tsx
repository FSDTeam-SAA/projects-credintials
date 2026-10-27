"use client";

import { UserRoundPlusIcon } from "lucide-react";
import { RequireRole } from "@/components/app/current-user";
import { LookupManager } from "@/components/lookup-manager";

export default function ProfileNamesPage() {
  return (
    <RequireRole roles={["admin"]}>
      <LookupManager
        config={{
          endpoint: "/profile-names",
          queryKey: "profile-names",
          title: "Add profile name",
          description: "Add the company profiles that client projects are delivered under.",
          listTitle: "All profile names",
          singular: "Profile name",
          placeholder: "webdev_pro2_Fiverr",
          addLabel: "Add Profile name",
          icon: <UserRoundPlusIcon />,
        }}
      />
    </RequireRole>
  );
}
