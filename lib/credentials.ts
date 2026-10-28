import type { Credential, CredentialKind, Resource } from "./types";

const SECRET_RX = /(pass(word)?|pwd|secret|token|private|api[_\s-]?key|access[_\s-]?key|auth|credential|salt|signature|dsn|connection[_\s-]?string|mongodb_uri|database_url)/i;
const MULTILINE_RX = /(private[_\s-]?key|ssh[_\s-]?key|certificate|cert|pem|json|nameservers)/i;
const URL_RX = /^https?:\/\/\S+$/i;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Best guess for how a field should be displayed, from its label and (optionally) its value. */
export function detectKind(label: string, value = ""): CredentialKind {
  if (value.includes("\n") || MULTILINE_RX.test(label)) return "multiline";
  if (isSensitiveCredential(label, value)) return "secret";
  if (URL_RX.test(value.trim()) || /\b(url|link|endpoint|host url)\b/i.test(label)) return "url";
  if (EMAIL_RX.test(value.trim()) || /\b(e-?mail|apple id)\b/i.test(label)) return "email";
  return "text";
}

export type ParsedEnvEntry = { label: string; value: string; kind: CredentialKind };

export function isSensitiveCredential(label: string, value = "") {
  if (SECRET_RX.test(label) || /^(?:sk_(?:live|test)_|gh[pousr]_|github_pat_|AKIA|-----BEGIN .*PRIVATE KEY)/.test(value)) return true;
  try { const url = new URL(value); return !!url.username || !!url.password; } catch { return false; }
}

export type EnvDiagnostic = { line: number; message: string };
export type EnvParseResult = { entries: ParsedEnvEntry[]; warnings: EnvDiagnostic[] };

/** Parse without executing expressions or expanding variables. Duplicate keys use their last definition. */
export function parseEnvDetailed(text: string): EnvParseResult {
  const entries = new Map<string, ParsedEnvEntry>();
  const warnings: EnvDiagnostic[] = [];
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line || line.startsWith("#")) continue;
    const lineNumber = i + 1;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*(?:=|:\s+)\s*(.*)$/);
    if (!match) { warnings.push({ line: lineNumber, message: "Expected KEY=value; this line was skipped." }); continue; }
    const key = match[1]!;
    let raw = match[2] ?? "";
    let value: string;
    const quote = raw[0];
    if (quote === '"' || quote === "'" || quote === "`") {
      raw = raw.slice(1);
      let closing = -1;
      while (true) {
        for (let j = 0; j < raw.length; j++) {
          if (raw[j] !== quote) continue;
          let slashes = 0;
          for (let k = j - 1; k >= 0 && raw[k] === "\\"; k--) slashes++;
          if (slashes % 2 === 0) { closing = j; break; }
        }
        if (closing >= 0 || i + 1 >= lines.length) break;
        raw += "\n" + lines[++i];
      }
      if (closing < 0) { warnings.push({ line: lineNumber, message: `${key}: missing closing quote; this entry was skipped.` }); continue; }
      const trailing = raw.slice(closing + 1).trim();
      if (trailing && !trailing.startsWith("#")) { warnings.push({ line: lineNumber, message: `${key}: unexpected text after the closing quote; this entry was skipped.` }); continue; }
      value = raw.slice(0, closing);
      if (quote === '"') value = value.replace(/\\(n|r|"|\\)/g, (_, char: string) => char === "n" ? "\n" : char === "r" ? "\r" : char);
    } else {
      value = raw.replace(/#.*$/, "").trim();
    }
    if (entries.has(key)) warnings.push({ line: lineNumber, message: `${key} is repeated; its last definition will be used.` });
    if (/\$\{[^}]+\}/.test(value)) warnings.push({ line: lineNumber, message: `${key} contains a variable reference; it will be kept literally.` });
    entries.set(key, { label: key, value, kind: detectKind(key, value) });
  }
  return { entries: [...entries.values()], warnings };
}

export function parseEnv(text: string): ParsedEnvEntry[] {
  return parseEnvDetailed(text).entries;
}

export type EnvMergeMode = "keep" | "replace";
export function planEnvImport(entries: ParsedEnvEntry[], existing: Pick<Credential, "label" | "value" | "kind">[], mode: EnvMergeMode) {
  const byLabel = new Map(existing.map(c => [c.label.trim(), c]));
  return entries.map(entry => {
    const previous = byLabel.get(entry.label.trim());
    const action: "add" | "unchanged" | "fill" | "replace" | "keep" = !previous ? "add" : previous.value === entry.value ? "unchanged" : !previous.value ? "fill" : mode === "replace" ? "replace" : "keep";
    return { ...entry, action };
  });
}

export function mergeEnvCredentials<T extends Pick<Credential, "label" | "value" | "kind">>(existing: T[], entries: ParsedEnvEntry[], mode: EnvMergeMode): (T | ParsedEnvEntry)[] {
  const merged: (T | ParsedEnvEntry)[] = [...existing];
  const byLabel = new Map(existing.map((c, i) => [c.label.trim(), i]));
  for (const entry of planEnvImport(entries, existing, mode)) {
    const index = byLabel.get(entry.label.trim());
    if (index === undefined) {
      byLabel.set(entry.label.trim(), merged.length);
      merged.push({ label: entry.label, value: entry.value, kind: entry.kind });
    } else if (entry.action === "fill" || entry.action === "replace") {
      merged[index] = { ...merged[index]!, value: entry.value, kind: entry.kind };
    }
  }
  return merged;
}

export function envFileEnvironment(filename: string): "production" | "staging" | "development" | undefined {
  if (/(?:^|[._-])(production|prod)(?:[._-]|$)/i.test(filename)) return "production";
  if (/(?:^|[._-])(staging|stage)(?:[._-]|$)/i.test(filename)) return "staging";
  if (/(?:^|[._-])(development|dev|local)(?:[._-]|$)/i.test(filename)) return "development";
  return undefined;
}

/** Serializes credentials as .env lines. Labels become UPPER_SNAKE_CASE keys. */
export function toEnv(credentials: Pick<Credential, "label" | "value">[]) {
  return credentials
    .filter((c) => c.label.trim())
    .map((c) => {
      const key = c.label
        .trim()
        .replace(/[^A-Za-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase();
      const needsQuotes = /[\s#"'=]/.test(c.value) || c.value.includes("\n");
      const value = needsQuotes ? `"${c.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"` : c.value;
      return `${key}=${value}`;
    })
    .join("\n");
}

/** A whole resource as readable text (for "Copy all"). */
export function resourceToText(r: Pick<Resource, "title" | "url" | "credentials" | "notes">) {
  const lines = [`# ${r.title}`];
  if (r.url) lines.push(`URL: ${r.url}`);
  for (const c of r.credentials) if (c.label) lines.push(`${c.label}: ${c.value}`);
  if (r.notes) lines.push("", `Notes: ${r.notes}`);
  return lines.join("\n");
}

const CHARSETS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*-_=+?",
};

/** Cryptographically random password with at least one of each character class. */
export function generatePassword(length = 20, symbols = true) {
  const sets = [CHARSETS.lower, CHARSETS.upper, CHARSETS.digits, ...(symbols ? [CHARSETS.symbols] : [])];
  const all = sets.join("");
  const rand = (max: number) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0]! % max;
  };
  const chars = sets.map((s) => s[rand(s.length)]!);
  while (chars.length < length) chars.push(all[rand(all.length)]!);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

export const KIND_LABEL: Record<CredentialKind, string> = {
  text: "Text",
  secret: "Secret",
  url: "Link",
  email: "Email",
  multiline: "Multi-line",
};

/** Quick-add chips under each resource. */
export const QUICK_FIELDS: { label: string; kind: CredentialKind }[] = [
  { label: "Username", kind: "text" },
  { label: "Email", kind: "email" },
  { label: "Password", kind: "secret" },
  { label: "API Key", kind: "secret" },
  { label: "Secret Key", kind: "secret" },
  { label: "Host / IP", kind: "text" },
  { label: "Port", kind: "text" },
];
