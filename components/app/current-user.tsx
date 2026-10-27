"use client";

import { createContext, use } from "react";
import { ShieldAlertIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { Role, User } from "@/lib/types";

const CurrentUserContext = createContext<User | null>(null);

export const CurrentUserProvider = CurrentUserContext.Provider;

export function useCurrentUser() {
  const user = use(CurrentUserContext);
  if (!user) throw new Error("useCurrentUser must be used inside the app shell");
  return user;
}

export function useCan() {
  const user = useCurrentUser();
  return {
    editProjects: user.role === "admin" || user.role === "operation",
    manageUsers: user.role === "admin",
    manageLookups: user.role === "admin",
  };
}

export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const user = useCurrentUser();
  if (!roles.includes(user.role)) {
    return (
      <EmptyState
        icon={<ShieldAlertIcon />}
        title="You don't have access to this page"
        description="Ask an admin if you think you should."
        className="py-24"
      />
    );
  }
  return children;
}
