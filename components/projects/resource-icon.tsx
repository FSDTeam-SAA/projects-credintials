import {
  AppWindowIcon,
  ArchiveIcon,
  BoxIcon,
  CloudCogIcon,
  CloudIcon,
  CreditCardIcon,
  DatabaseIcon,
  DropletIcon,
  FileCode2Icon,
  FlameIcon,
  GitBranchIcon,
  GlobeIcon,
  HexagonIcon,
  ImageIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LeafIcon,
  MailIcon,
  PenToolIcon,
  PlayIcon,
  ServerIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TriangleIcon,
  WebhookIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Look = { icon: LucideIcon; className: string };

const BY_TEMPLATE: Record<string, Look> = {
  vps: { icon: ServerIcon, className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  cpanel: { icon: LayoutDashboardIcon, className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  vercel: { icon: TriangleIcon, className: "bg-neutral-900/10 text-neutral-900 dark:text-neutral-100" },
  netlify: { icon: HexagonIcon, className: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  aws: { icon: CloudCogIcon, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  digitalocean: { icon: DropletIcon, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  domain: { icon: GlobeIcon, className: "bg-brand/10 text-brand" },
  cloudflare: { icon: ShieldCheckIcon, className: "bg-orange-500/10 text-orange-500 dark:text-orange-400" },
  smtp: { icon: MailIcon, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  mongodb: { icon: LeafIcon, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  sql: { icon: DatabaseIcon, className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  firebase: { icon: FlameIcon, className: "bg-amber-500/10 text-amber-500 dark:text-amber-400" },
  cloudinary: { icon: ImageIcon, className: "bg-blue-500/10 text-blue-500 dark:text-blue-400" },
  s3: { icon: ArchiveIcon, className: "bg-red-500/10 text-red-500 dark:text-red-400" },
  "app-store": { icon: SmartphoneIcon, className: "bg-sky-500/10 text-sky-500 dark:text-sky-400" },
  "play-store": { icon: PlayIcon, className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  github: { icon: GitBranchIcon, className: "bg-neutral-900/10 text-neutral-800 dark:text-neutral-100" },
  figma: { icon: PenToolIcon, className: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400" },
  stripe: { icon: CreditCardIcon, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  api: { icon: WebhookIcon, className: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  "website-admin": { icon: AppWindowIcon, className: "bg-brand/10 text-brand" },
  env: { icon: FileCode2Icon, className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  custom: { icon: KeyRoundIcon, className: "bg-warn/15 text-warn-text" },
};

const BY_TYPE: Record<string, Look> = {
  Website: BY_TEMPLATE["website-admin"]!,
  VPS: BY_TEMPLATE.vps!,
  Hosting: BY_TEMPLATE.cpanel!,
  Domain: BY_TEMPLATE.domain!,
  Database: BY_TEMPLATE.sql!,
  "Cloud Storage": { icon: CloudIcon, className: "bg-sky-500/10 text-sky-500 dark:text-sky-400" },
  "Cloud Provider": BY_TEMPLATE.aws!,
  "App Store": BY_TEMPLATE["app-store"]!,
  "Play Store": BY_TEMPLATE["play-store"]!,
  Repository: BY_TEMPLATE.github!,
  Design: BY_TEMPLATE.figma!,
  Email: BY_TEMPLATE.smtp!,
  Payment: BY_TEMPLATE.stripe!,
  API: BY_TEMPLATE.api!,
};

const FALLBACK: Look = { icon: BoxIcon, className: "bg-muted text-muted-foreground" };

export function resourceLook(template?: string | null, type?: string): Look {
  return (template && BY_TEMPLATE[template]) || (type && BY_TYPE[type]) || FALLBACK;
}

export function ResourceIcon({
  template,
  type,
  className,
  size = "md",
}: {
  template?: string | null;
  type?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { icon: Icon, className: tone } = resourceLook(template, type);
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg",
        size === "sm" && "size-7 [&_svg]:size-3.5",
        size === "md" && "size-9 [&_svg]:size-[18px]",
        size === "lg" && "size-11 [&_svg]:size-5",
        tone,
        className,
      )}
    >
      <Icon />
    </span>
  );
}
