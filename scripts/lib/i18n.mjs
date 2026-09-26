// Shared, locale-agnostic helpers for the documentation tooling.
//
// Nothing here knows which languages exist. Everything is driven by
// i18n/locales.json, so adding a language never changes code.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function readJson(relPath) {
  return JSON.parse(readFileSync(join(ROOT, relPath), "utf8"));
}

export function loadRegistry() {
  const registry = readJson("i18n/locales.json");
  const codes = registry.locales.map((l) => l.code);
  if (codes.length === 0) throw new Error("i18n/locales.json lists no locale");
  if (new Set(codes).size !== codes.length) {
    throw new Error("i18n/locales.json lists a locale twice");
  }
  if (!codes.includes(registry.reference)) {
    throw new Error(
      `reference locale "${registry.reference}" is not an active locale`,
    );
  }
  return registry;
}

export function loadNavigation() {
  return readJson("i18n/navigation.json");
}

export function loadChrome() {
  return readJson("i18n/chrome.json");
}

/** Every logical page id, in navigation order. */
export function logicalPageIds(navigation) {
  return navigation.groups.flatMap((g) => g.pages);
}

/**
 * A directory name that looks like a language code (`de`, `pt-BR`, `zh-Hant`).
 * Used to spot a locale namespace that the registry does not know about.
 */
export const LOCALE_DIR_PATTERN = /^[a-z]{2}(-[A-Za-z]{2,4})?$/;
