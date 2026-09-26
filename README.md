# Tivero Help Center

Customer documentation for [Tivero](https://tivero.app), published at
**https://help.tivero.app**. Built with [Mintlify](https://mintlify.com).

Tivero is a multi-tenant SaaS for absences, planned unavailability, approvals and
working-day calendars. The documentation covers only what the product does today.

## Structure

```
docs.json               Mintlify configuration (navigation is generated)
i18n/locales.json       active locales — the single list of languages
i18n/navigation.json    logical articles, groups and per-locale group labels
i18n/chrome.json        per-locale navbar and footer text
pl/<group>/<slug>.mdx   Polish pages (reference locale)
en/<group>/<slug>.mdx   English pages (same slugs)
scripts/                navigation generator and CI checks
```

Each article has one logical id (`<group>/<slug>`) shared by all locales, so
`/pl/time-off/balances` and `/en/time-off/balances` are the same article.

## Local development

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev        # preview at http://localhost:3000
npm run check      # run every gate CI runs
```

After changing `i18n/*.json`, run `npm run build:nav` and commit the updated
`docs.json`.

## Adding a language

See "Adding a locale" in [AGENTS.md](AGENTS.md). In short: register it in
`i18n/locales.json`, add labels in `i18n/navigation.json` and `i18n/chrome.json`,
translate every page, then run `npm run build:nav && npm run check`. No code
changes are needed.

## Publishing

Changes reach help.tivero.app only through a reviewed pull request merged into
the default branch, with green CI. Nothing is published manually from this
repository.

## Contact

hello@tivero.app
