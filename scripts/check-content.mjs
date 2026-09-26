// Content hygiene: no Mintlify starter residue anywhere in the repository,
// and no placeholder text in customer pages.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { ROOT, loadRegistry } from "./lib/i18n.mjs";

const SKIP = new Set([".git", "node_modules", ".mint"]);
const SELF = relative(ROOT, new URL(import.meta.url).pathname);

// Strings that only exist in the Mintlify starter kit.
const STARTER_RESIDUE = [
  "Mintlify Starter Kit",
  "hi@mintlify.com",
  "app.mintlify.com",
  "Welcome to your project",
  "Requirement one",
  "your-package",
  "mintlify.com/blog",
  "dashboard.mintlify.com",
  "x.com/mintlify",
  "github.com/mintlify",
  "linkedin.com/company/mintlify",
];
// The help center lives at help.tivero.app; the old working name must not leak.
const WRONG_DOMAIN = "docs.tivero.app";
// Placeholders a customer must never read.
const PLACEHOLDER = /\b(TODO|TBD|FIXME)\b|lorem ipsum/i;

function files(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...files(path));
    else out.push(path);
  }
  return out;
}

const errors = [];
const localeDirs = loadRegistry().locales.map((l) => `${l.code}/`);

for (const file of files(ROOT)) {
  const rel = relative(ROOT, file);
  if (rel === SELF || rel === "package-lock.json" || rel === "LICENSE") {
    continue;
  }
  if (/\.(png|jpe?g|gif|webp|ico)$/i.test(rel)) continue;
  const text = readFileSync(file, "utf8");
  for (const residue of STARTER_RESIDUE) {
    if (text.includes(residue)) {
      errors.push(`starter residue "${residue}" in ${rel}`);
    }
  }
  if (text.includes(WRONG_DOMAIN)) {
    errors.push(`"${WRONG_DOMAIN}" in ${rel} — the help center is help.tivero.app`);
  }
  if (localeDirs.some((d) => rel.startsWith(d)) && PLACEHOLDER.test(text)) {
    errors.push(`placeholder text in customer page ${rel}`);
  }
}

if (errors.length > 0) {
  console.error(`content check FAILED (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  "content check OK: no starter residue, no placeholders, no docs.tivero.app",
);
