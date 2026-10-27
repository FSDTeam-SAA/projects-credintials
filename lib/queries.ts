"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type {
  ExpiringItem,
  Lookup,
  Paged,
  Project,
  ProjectMeta,
  ProjectRow,
  User,
  UserStats,
} from "./types";

export const qk = {
  me: ["me"] as const,
  meta: ["projects", "meta"] as const,
  projects: (params: object) => ["projects", "list", params] as const,
  project: (id: string) => ["projects", "detail", id] as const,
  expiring: ["projects", "expiring"] as const,
  tags: ["projects", "tags"] as const,
  categories: (search = "") => ["categories", search] as const,
  profileNames: (search = "") => ["profile-names", search] as const,
  users: (params: object) => ["users", "list", params] as const,
  userStats: ["users", "stats"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api.get<{ user: User }>("/auth/me").then((r) => r.user),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectMeta() {
  return useQuery({
    queryKey: qk.meta,
    queryFn: () => api.get<ProjectMeta>("/projects/meta"),
    staleTime: Infinity,
  });
}

export type ProjectListParams = {
  search?: string;
  category?: string;
  profileName?: string;
  serviceLine?: string;
  tag?: string;
  expiring?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: qk.projects(params),
    queryFn: () => api.get<Paged<ProjectRow>>("/projects", params),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: qk.project(id),
    queryFn: () => api.get<{ project: Project }>(`/projects/${id}`).then((r) => r.project),
  });
}

export function useExpiring() {
  return useQuery({
    queryKey: qk.expiring,
    queryFn: () => api.get<{ items: ExpiringItem[] }>("/projects/expiring", { days: 30 }).then((r) => r.items),
  });
}

export function useTags() {
  return useQuery({
    queryKey: qk.tags,
    queryFn: () => api.get<{ items: string[] }>("/projects/tags").then((r) => r.items),
  });
}

export function useCategories(search = "") {
  return useQuery({
    queryKey: qk.categories(search),
    queryFn: () => api.get<{ items: Lookup[] }>("/categories", { search }).then((r) => r.items),
    placeholderData: keepPreviousData,
  });
}

export function useProfileNames(search = "") {
  return useQuery({
    queryKey: qk.profileNames(search),
    queryFn: () => api.get<{ items: Lookup[] }>("/profile-names", { search }).then((r) => r.items),
    placeholderData: keepPreviousData,
  });
}

export function useUsers(params: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: () => api.get<Paged<User>>("/users", params),
    placeholderData: keepPreviousData,
  });
}

export function useUserStats(enabled = true) {
  return useQuery({
    queryKey: qk.userStats,
    queryFn: () => api.get<UserStats>("/users/stats"),
    enabled,
  });
}
