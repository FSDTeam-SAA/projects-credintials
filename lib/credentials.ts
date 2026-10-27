import type { Credential, CredentialKind, Resource } from "./types";

const SECRET_RX = /(pass(word)?|pwd|secret|token|private|api[_\s-]?key|access[_\s-]?key|auth|credential|salt|signature|dsn|connection[_\s-]?string|mongodb_uri|database_url)/i;
const MULTILINE_RX = /(private[_\s-]?key|ssh[_\s-]?key|certificate|cert|pem|json|nameservers)/i;
const URL_RX = /^https?:\/\/\S+$/i;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Best guess for how a field should be displayed, from its label and (optionally) its value. */
export function detectKind(label: string, value = ""): CredentialKind {
  if (value.includes("\n") || MULTILINE_RX.test(label)) return "multiline";
  if (SECRET_RX.test(label)) return "secret";
  if (URL_RX.test(value.trim()) || /\b(url|link|endpoint|host url)\b/i.test(label)) return "url";
  if (EMAIL_RX.test(value.trim()) || /\b(e-?mail|apple id)\b/i.test(label)) return "email";
  return "text";
}

export type ParsedEnvEntry = { label: string; value: string; kind: CredentialKind };

/**
 * Parses .env style text: KEY=value, `export KEY=value`, quoted values (incl. multi-line
 * double-quoted values), inline `# comments` on unquoted values. Lines without "=" are ignored.
 */
export function parseEnv(text: string): ParsedEnvEntry[] {
  const out: ParsedEnvEntry[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.\-]*)\s*[=:]\s*(.*)$/);
    if (!m) continue;
    const key = m[1]!;
    let raw = m[2] ?? "";
    let value: string;

    const quote = raw[0];
    if (quote === '"' || quote === "'" || quote === "`") {
      raw = raw.slice(1);
      // Multi-line quoted value: keep consuming lines until the closing quote.
      while (!raw.trimEnd().endsWith(quote) && i + 1 < lines.length) {
        raw += "\n" + lines[++i];
      }
      value = raw.trimEnd().replace(new RegExp(`${quote}$`), "");
      if (quote === '"') value = value.replace(/\\n/g, "\n");
    } else {
      value = raw.replace(/\s+#.*$/, "").trim();
    }

    out.push({ label: key, value, kind: detectKind(key, value) });
  }
  return out;
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
