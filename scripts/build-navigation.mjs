// Generates `navigation.languages` in docs.json from the locale registry
// (i18n/locales.json), the shared logical navigation (i18n/navigation.json)
// and the per-locale chrome (i18n/chrome.json).
//
//   npm run build:nav   rewrite docs.json
//   npm run check:nav   fail if docs.json is not what this script would write
//
// The rest of docs.json (theme, colors, logo, contextual menu) is owned by
// hand; only `navigation` is generated. Nothing here names a language.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  ROOT,
  loadChrome,
  loadNavigation,
  loadRegistry,
} from "./lib/i18n.mjs";

const CHECK = process.argv.includes("--check");
const CONTACT_EMAIL = "hello@tivero.app";
const APP_ORIGIN = "https://dash.tivero.app";

function fill(template, locale) {
  return template
    .replaceAll("{app}", locale.appLocale)
    .replaceAll("{site}", locale.siteLocale);
}

function languageEntry(locale, navigation, chrome) {
  const words = chrome[locale.code];
  if (!words) {
    throw new Error(`i18n/chrome.json has no entry for "${locale.code}"`);
  }
  return {
    language: locale.code,
    navbar: {
      links: [{ label: words.contact, href: `mailto:${CONTACT_EMAIL}` }],
      primary: {
        type: "button",
        label: words.signIn,
        href: `${APP_ORIGIN}/${locale.appLocale}/sign-in`,
      },
    },
    footer: {
      links: [
        {
          header: words.footerHeader,
          items: words.footerLinks.map((l) => ({
            label: l.label,
            href: fill(l.href, locale),
          })),
        },
      ],
    },
    groups: navigation.groups.map((group) => {
      const label = group.label[locale.code];
      if (!label) {
        throw new Error(
          `group "${group.id}" has no label for "${locale.code}" in i18n/navigation.json`,
        );
      }
      return {
        group: label,
        icon: group.icon,
        pages: group.pages.map((id) => `${locale.code}/${id}`),
      };
    }),
  };
}

const registry = loadRegistry();
const navigation = loadNavigation();
const chrome = loadChrome();

const docsPath = join(ROOT, "docs.json");
const current = readFileSync(docsPath, "utf8");
const docs = JSON.parse(current);

docs.navigation = {
  languages: registry.locales.map((l) => languageEntry(l, navigation, chrome)),
};

const next = `${JSON.stringify(docs, null, 2)}\n`;

if (CHECK) {
  if (next !== current) {
    console.error(
      "docs.json navigation is out of date. Run `npm run build:nav` and commit the result.",
    );
    process.exit(1);
  }
  console.log(
    `navigation OK: ${registry.locales.length} locale(s), ${navigation.groups.length} groups`,
  );
} else {
  writeFileSync(docsPath, next);
  console.log(
    `docs.json navigation written for: ${registry.locales.map((l) => l.code).join(", ")}`,
  );
}
