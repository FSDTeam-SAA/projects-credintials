export type Role = "admin" | "sales" | "operation";
export type UserStatus = "pending" | "approved" | "rejected";

export type User = {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PageMeta = { total: number; page: number; limit: number; totalPages: number };
export type Paged<T> = { items: T[]; meta: PageMeta };

export type Lookup = { id: string; name: string; projectCount?: number; createdAt?: string };
export type Client = { id: string; name: string; projectCount: number; createdAt?: string };
export type ProjectLink = { label: string; url: string };

export type CredentialKind = "text" | "secret" | "url" | "email" | "multiline";
export type Environment = "production" | "staging" | "development";

export type Credential = { id?: string; label: string; value: string; kind: CredentialKind };

export type Resource = {
  id?: string;
  title: string;
  type: string;
  template?: string | null;
  environment: Environment;
  url: string;
  notes: string;
  expiresAt: string | null;
  credentials: Credential[];
};

type Ref = { id: string; name: string } | null;
type UserRef = { id: string; name: string; role: Role } | null;

export type Project = {
  id: string;
  name: string;
  client: { id: string; name: string } | null;
  liveSites: ProjectLink[];
  repositories: ProjectLink[];
  clientName: string;
  profileName: Ref;
  category: Ref;
  serviceLine: string;
  liveUrl: string;
  repoUrl: string;
  tags: string[];
  notes: string;
  resources: Resource[];
  createdBy: UserRef;
  updatedBy: UserRef;
  createdAt: string;
  updatedAt: string;
};

export type ProjectRow = {
  id: string;
  name: string;
  client: { id: string; name: string } | null;
  liveSites: ProjectLink[];
  repositories: ProjectLink[];
  clientName: string;
  profileName: Ref;
  category: Ref;
  serviceLine: string;
  liveUrl: string;
  tags: string[];
  resourceCount: number;
  resourceTypes: string[];
  nextExpiry: string | null;
  expiringSoon: boolean;
  updatedBy: UserRef;
  updatedAt: string;
};

export type ResourceTemplate = {
  key: string;
  label: string;
  type: string;
  group: string;
  urlPlaceholder?: string;
  hasExpiry?: boolean;
  fields: { label: string; kind: CredentialKind }[];
};

export type ProjectMeta = {
  serviceLines: string[];
  resourceTypes: string[];
  environments: Environment[];
  credentialKinds: CredentialKind[];
  templates: ResourceTemplate[];
};

export type ExpiringItem = {
  projectId: string;
  projectName: string;
  clientName: string;
  resourceId: string;
  resourceTitle: string;
  resourceType: string;
  environment: Environment;
  expiresAt: string;
};

export type UserStats = { total: number; admin: number; sales: number; operation: number; pending: number };
