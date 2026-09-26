// Publish-surface guard: nothing but customer pages may become a Mintlify page.
//
// Mintlify turns every .md/.mdx file it finds into a reachable URL, even when
// the file is missing from navigation. So every Markdown file in the
// repository must be either
//   - a customer page under an active locale directory, or
//   - explicitly ignored in .mintignore.
// The repository-only documents below must always be listed by name.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { ROOT, loadRegistry } from "./lib/i18n.mjs";

const REQUIRED_IGNORES = ["AGENTS.md", "README.md", "THIRD_PARTY_NOTICES.md"];
// Mintlify never reads these; they are not part of the publish surface.
const SKIP = new Set([".git", ".github", ".mint", "node_modules"]);

const errors = [];
const locales = loadRegistry().locales.map((l) => l.code);

const ignores = existsSync(join(ROOT, ".mintignore"))
  ? readFileSync(join(ROOT, ".mintignore"), "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
  : [];

for (const name of REQUIRED_IGNORES) {
  if (!ignores.includes(name)) errors.push(`.mintignore must list "${name}"`);
}

/** Deliberately small subset of gitignore syntax: `dir/`, `/*.ext`, `*.ext`, exact path. */
function isIgnored(rel) {
  return ignores.some((rule) => {
    if (rule.endsWith("/")) return rel.startsWith(rule);
    if (rule.startsWith("/*.")) return !rel.includes("/") && rel.endsWith(rule.slice(2));
    if (rule.startsWith("*.")) return rel.endsWith(rule.slice(1));
    return rel === rule;
  });
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(relative(ROOT, path));
  }
  return out;
}

let pages = 0;
for (const rel of walk(ROOT)) {
  if (!/\.mdx?$/.test(rel)) continue;
  const top = rel.split("/")[0];
  if (locales.includes(top) && rel.includes("/")) {
    pages += 1;
    continue;
  }
  if (!isIgnored(rel)) {
    errors.push(
      `${rel} would be published — move it under a locale directory or add it to .mintignore`,
    );
  }
}

if (errors.length > 0) {
  console.error(`publish-surface check FAILED (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `publish-surface OK: ${pages} customer pages under ${locales.join(", ")}; every other Markdown file is ignored`,
);
