import { differenceInCalendarDays, format, formatDistanceToNow } from "date-fns";
import type { Role } from "./types";

export const roleLabel: Record<Role, string> = {
  admin: "Admin",
  sales: "Sales",
  operation: "Operation",
};

export function timeAgo(date?: string | Date | null) {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function shortDate(date?: string | Date | null) {
  if (!date) return "";
  return format(new Date(date), "d MMM yyyy");
}

export function daysUntil(date: string | Date) {
  return differenceInCalendarDays(new Date(date), new Date());
}

/** "Expired 3 days ago" / "Expires today" / "Expires in 12 days" */
export function expiryLabel(date: string | Date) {
  const d = daysUntil(date);
  if (d < 0) return `Expired ${Math.abs(d)} day${d === -1 ? "" : "s"} ago`;
  if (d === 0) return "Expires today";
  return `Expires in ${d} day${d === 1 ? "" : "s"}`;
}

export function expiryTone(date: string | Date): "danger" | "warn" | "ok" {
  const d = daysUntil(date);
  if (d < 0) return "danger";
  if (d <= 30) return "warn";
  return "ok";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
