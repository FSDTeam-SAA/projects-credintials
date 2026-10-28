import assert from "node:assert/strict";
import test from "node:test";
import { detectKind, envFileEnvironment, isSensitiveCredential, mergeEnvCredentials, parseEnv, parseEnvDetailed, planEnvImport, toEnv } from "./credentials";

test("env parsing supports exports, quotes, inline comments, empty values and multiline secrets", () => {
  const report = parseEnvDetailed('\uFEFF# Comment\r\nexport PORT=5000 # server\r\nEMPTY=\r\nNAME="A # B" # comment\r\nSINGLE=\'literal ${PORT}\'\r\nPRIVATE_KEY="line one\nline two"\nJSON=`{"a":1}`');
  assert.deepEqual(report.entries.map(e => [e.label, e.value]), [["PORT", "5000"], ["EMPTY", ""], ["NAME", "A # B"], ["SINGLE", "literal ${PORT}"], ["PRIVATE_KEY", "line one\nline two"], ["JSON", '{"a":1}']]);
  assert.equal(report.entries.find(e => e.label === "PRIVATE_KEY")?.kind, "multiline");
  assert.equal(report.warnings.length, 1);
  assert.match(report.warnings[0].message, /kept literally/);
});

test("malformed lines and duplicate definitions are reported without exposing values", () => {
  const result = parseEnvDetailed('TOKEN=first-secret\nTOKEN=last-secret\nnot an assignment\nBROKEN="unterminated');
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].value, "last-secret");
  assert.equal(result.warnings.length, 3);
  assert.ok(!JSON.stringify(result.warnings).includes("secret"));
  assert.equal(parseEnv('A="one" unexpected\nB=two')[0].label, "B");
});

test("escaped .env exports round trip, including quotes, backslashes and line breaks", () => {
  const values = ["normal", 'a "quote" and \\ path', "line one\nline two", "literal \\n", "hello#world", "", "a=b"];
  const source = values.map((value, i) => ({ label: `KEY_${i}`, value }));
  assert.deepEqual(parseEnv(toEnv(source)).map(e => e.value), values);
});

test("merge preview and applied changes agree, keep populated values by default and preserve unrelated credentials", () => {
  const existing = [{ label: "TOKEN", value: "old", kind: "secret" as const, id: "existing-id" }, { label: "PORT", value: "", kind: "text" as const }, { label: "OTHER", value: "untouched", kind: "text" as const }];
  const imported = parseEnv("TOKEN=new\nPORT=5000\nHOST=localhost");
  assert.deepEqual(planEnvImport(imported, existing, "keep").map(e => e.action), ["keep", "fill", "add"]);
  const kept = mergeEnvCredentials(existing, imported, "keep");
  assert.equal(kept[0].value, "old");
  assert.equal(kept[1].value, "5000");
  assert.equal(kept[2].value, "untouched");
  assert.equal(kept[3].label, "HOST");
  assert.equal(existing[1].value, "");
  const replaced = mergeEnvCredentials(existing, imported, "replace");
  assert.equal(replaced[0].value, "new");
  assert.equal((replaced[0] as { id: string }).id, "existing-id");
  assert.equal(planEnvImport(parseEnv("TOKEN=old"), existing, "replace")[0].action, "unchanged");
});

test("environment keys remain case-sensitive and duplicate input cannot create duplicate credentials", () => {
  const entries = parseEnv("HOST=one\nhost=two");
  assert.equal(entries.length, 2);
  assert.equal(mergeEnvCredentials([], [...entries, entries[0]], "replace").length, 2);
});

test("sensitive URLs, private keys and known token formats are detected", () => {
  assert.equal(detectKind("DATABASE_URL", "postgres://user:password@host/db"), "secret");
  assert.equal(detectKind("VALUE", "https://user:password@example.com"), "secret");
  assert.equal(detectKind("VALUE", "ghp_example"), "secret");
  assert.ok(isSensitiveCredential("PRIVATE_KEY", "multiline\nsecret"));
  assert.equal(detectKind("SITE", "https://example.com"), "url");
  assert.equal(detectKind("CONTACT", "hello@example.com"), "email");
});

test("filenames suggest environments without overriding unknown filenames", () => {
  assert.equal(envFileEnvironment(".env.production"), "production");
  assert.equal(envFileEnvironment(".env.staging.local"), "staging");
  assert.equal(envFileEnvironment(".env.local"), "development");
  assert.equal(envFileEnvironment(".env"), undefined);
});
