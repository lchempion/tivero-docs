// Locale parity for ANY number of locales (i18n/locales.json).
//
// Fails when:
//   - a logical page is missing in an active locale;
//   - a locale directory holds an .mdx page that navigation does not list
//     (orphan);
//   - a directory named like a locale exists but is not an active locale
//     (unexpected namespace), or a customer page sits outside any locale;
//   - docs.json does not list exactly the active locales, in registry order;
//   - a page has no title or description in its frontmatter;
//   - a page links to another locale or to an unprefixed internal path.
//
// Adding a language requires no change here.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import {
  LOCALE_DIR_PATTERN,
  ROOT,
  loadNavigation,
  loadRegistry,
  logicalPageIds,
  readJson,
} from "./lib/i18n.mjs";

const IGNORED_DIRS = new Set([
  ".git",
  ".github",
  ".mint",
  "node_modules",
  "scripts",
  "i18n",
  "logo",
  "images",
  "snippets",
]);

const errors = [];
const registry = loadRegistry();
const codes = registry.locales.map((l) => l.code);
const navigation = loadNavigation();
const ids = logicalPageIds(navigation);

if (new Set(ids).size !== ids.length) {
  errors.push("i18n/navigation.json lists a page id twice");
}

function mdxFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...mdxFiles(path));
    else if (name.endsWith(".mdx") || name.endsWith(".md")) out.push(path);
  }
  return out;
}

function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) fields[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return fields;
}

// 1. Top-level layout: only active locale directories may hold pages.
for (const name of readdirSync(ROOT)) {
  const path = join(ROOT, name);
  if (statSync(path).isDirectory()) {
    if (IGNORED_DIRS.has(name) || name.startsWith(".")) continue;
    if (LOCALE_DIR_PATTERN.test(name) && !codes.includes(name)) {
      errors.push(
        `unexpected locale namespace "${name}/" — add it to i18n/locales.json or remove it`,
      );
    } else if (!codes.includes(name)) {
      errors.push(`unexpected content directory "${name}/" outside any locale`);
    }
  } else if (name.endsWith(".mdx")) {
    errors.push(
      `page "${name}" sits at the root — every customer page belongs to a locale`,
    );
  }
}

// 2. Every logical page exists in every active locale; no orphans.
let pageCount = 0;
for (const code of codes) {
  const expected = new Set(ids.map((id) => `${code}/${id}.mdx`));
  for (const id of ids) {
    if (!existsSync(join(ROOT, code, `${id}.mdx`))) {
      errors.push(`missing: ${code}/${id}.mdx`);
    }
  }
  for (const file of mdxFiles(join(ROOT, code))) {
    const rel = relative(ROOT, file);
    if (!expected.has(rel)) {
      errors.push(`orphan (not in navigation): ${rel}`);
      continue;
    }
    pageCount += 1;
    const source = readFileSync(file, "utf8");
    const fm = frontmatter(source);
    if (!fm.title) errors.push(`no title: ${rel}`);
    if (!fm.description) errors.push(`no description: ${rel}`);

    // 3. Internal links stay inside the page's own locale.
    for (const m of source.matchAll(/\]\((\/[^)\s#]*)|href="(\/[^"#]*)"/g)) {
      const target = m[1] ?? m[2];
      const first = target.split("/")[1] ?? "";
      if (first !== code) {
        errors.push(
          codes.includes(first)
            ? `${rel} links into another locale: ${target}`
            : `${rel} links to an unprefixed internal path: ${target}`,
        );
      }
    }
  }
}

// 4. docs.json lists exactly the active locales, in registry order.
const docs = readJson("docs.json");
const configured = (docs.navigation?.languages ?? []).map((l) => l.language);
if (JSON.stringify(configured) !== JSON.stringify(codes)) {
  errors.push(
    `docs.json languages [${configured}] differ from i18n/locales.json [${codes}] — run npm run build:nav`,
  );
}

if (errors.length > 0) {
  console.error(`locale parity FAILED (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `locale parity OK: ${ids.length} logical articles × ${codes.length} locales (${codes.join(", ")}) = ${pageCount} pages; reference ${registry.reference}`,
);
