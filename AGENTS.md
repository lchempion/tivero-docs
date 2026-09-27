# Tivero customer documentation — agent instructions

Customer-facing help center for Tivero, published at **https://help.tivero.app**
(the product runs at https://dash.tivero.app, the marketing site at
https://tivero.app). Built with Mintlify; configuration lives in `docs.json`.

## Source of truth

- Document only what the product actually does today. Verify every claim
  against the Tivero app (its UI copy and its behavior) before writing it.
- Never document a feature that is partial, hidden, behind a flag, or not
  implemented as if it were available. When in doubt, leave it out.
- Use the exact, localized UI labels in **bold**, as the app shows them in that
  language (for example **Nowy wniosek** / **New request**).
- A UI label that contains a runtime value (such as a year) is written with an
  ellipsis: **Potwierdź kalendarz na …**. Never put curly-brace placeholders in
  MDX text — MDX evaluates them as JavaScript.

## Product ↔ Help Center synchronization

The app (`lchempion/tivero`) is the source of truth; this site describes it.

- When a docs change describes UI labels, routes/navigation, workflows,
  permissions, configuration, screenshots or troubleshooting, verify it against
  the CURRENT app first. Never let an instruction or a screenshot describe an
  older UI.
- Every customer-facing app change is classified in its PR (`DOCS_IMPACT`,
  `ONBOARDING_CHECKLIST_IMPACT`, see the app's `CLAUDE.md`). An
  `UPDATE_REQUIRED` there is closed only by the matching change here.
- Article paths are a contract: the app links to specific articles from its
  setup checklist and "Learn more" links (`src/lib/help-center.ts`). Keep
  paths stable — change navigation in `i18n/`/`docs.json`, not the path — and
  if a path must change, change the app registry in the same programme.
- Applies to every locale this site publishes, not only `pl`/`en`.

## Terminology

These four concepts are different and must never be used interchangeably:

| Concept | PL | EN |
|---|---|---|
| Absence type | typ nieobecności | absence type |
| Absence policy | zasada nieobecności | absence policy |
| Balance | saldo | balance |
| Approval | akceptacja | approval |

Other rules:

- For B2B contractors say "planowana niedostępność" / "planned unavailability",
  never "urlop" / "leave".
- Workspace = "przestrzeń robocza" / "workspace". Roles: Pracownik / Employee,
  Manager, Kadry (HR) / HR, Administrator, Właściciel / Owner.
- Holiday calendar: the provider supplies a **reference** calendar; the
  customer's **confirmed** calendar is what counts. Never claim Tivero is
  "automatically compliant" or legally correct in any country.

## Style

- Second person, active voice, one idea per sentence, sentence-case headings.
- Polish pages use gender-neutral forms (no "zrobiłeś/zrobiłaś").
- Article shape: goal → who / prerequisites / where → steps → result → behavior
  details → troubleshooting → related articles.
- Use Mintlify components (`Steps`, `Note`, `Warning`, `Tip`, `Info`,
  `CardGroup`, `Tabs`) where they help, not decoratively.

## Content boundaries

Never publish:

- internal architecture, database models, internal IDs, hosting or cloud
  topology, schedulers, migration tooling, feature flags, secret or config
  names, analytics vendor internals, provider identifiers, internal support
  tooling;
- prices (link to https://tivero.app/<locale>/pricing instead);
- compliance or certification claims (SOC 2, ISO 27001, "GDPR compliant");
- screenshots with real customer data, PII, secrets or production identifiers;
- placeholder text or "screenshot goes here" notes.

The support contact is `hello@tivero.app`. Do not invent other support URLs or
addresses.

## Information architecture

- The entry page offers paths by **role** (Employee, Manager, HR and admin,
  Microsoft 365 admin). Role guides in `roles/*-guide` are lightweight hubs:
  what the role does, first actions, where to go, common problems. They link to
  canonical articles and never duplicate procedures.
- Detailed content is organized by **domain** (people, time off, calendars…).
- "Reference and concepts" reuses cross-cutting pages (`time-off/key-concepts`,
  `roles/roles-and-permissions`). Navigation and file paths do not need to
  match — do not move files to change a menu.

## Screenshots

- Only real, current Tivero UI from the public Interactive Demo (synthetic
  data), captured per locale. Never mock, edit or AI-generate UI, and never
  change labels inside an image.
- No email addresses (demo addresses contain an internal id), internal ids,
  tokens, browser chrome, DevTools or demo-only states (for example a
  "sample calendar"). Crop to the relevant part of the app.
- Store as optimized WebP at `images/<locale>/<scenario>.webp`, with the same
  scenario names in every locale.
- Embed inside the step that needs it with `<Frame><img … alt="…" /></Frame>`.
  Alt text is localized and describes what the reader should see.
- `check:locales` fails on a missing, orphaned, cross-locale or alt-less image.

## Localization (N locales)

- Active locales are listed **only** in `i18n/locales.json`. `pl` is the
  reference locale; there is no special root language.
- Every page lives at `<locale>/<group>/<slug>.mdx`. The path after the locale
  is the **logical article id** and is identical in every locale; only the
  title, description, navigation label and content are localized.
- Navigation is defined once in `i18n/navigation.json` (logical ids and
  per-locale group labels). Navbar and footer text per locale is in
  `i18n/chrome.json`. `docs.json` → `navigation.languages` is **generated** —
  never edit it by hand; run `npm run build:nav`.
- Internal links always carry the page's own locale prefix (`/pl/...` in Polish
  pages, `/en/...` in English pages).
- Every logical article must exist in every active locale (1:1 parity).

### Adding a locale (for example `de`)

(Also capture its screenshots under `images/de/`.)


1. Add `{ "code": "de", ... }` to `i18n/locales.json`.
2. Add `de` labels to every group in `i18n/navigation.json` and a `de` entry in
   `i18n/chrome.json`.
3. Write a real, reviewed translation of **every** page under `de/`. Do not add
   empty, stub or machine-translated pages, and do not activate a locale before
   all of its pages are ready.
4. Run `npm run build:nav`, then `npm run check`.

No script changes are needed.

## Publish surface and licensing

- Mintlify publishes every `.md`/`.mdx` file it finds, even outside the
  navigation. Customer pages live only under active locale directories;
  repository documents (`AGENTS.md`, `README.md`, `THIRD_PARTY_NOTICES.md`) and
  tooling are listed in `.mintignore`. `check:publish` enforces this.
- Tivero-authored content is not MIT-licensed. The Mintlify starter's MIT
  notice lives in `THIRD_PARTY_NOTICES.md`; keep it intact.

## Commands

```bash
npm ci                 # install the pinned Mintlify CLI
npm run dev            # local preview (mint dev)
npm run build:nav      # regenerate docs.json navigation from i18n/
npm run check          # every gate below, in CI order
npm run check:nav      # docs.json navigation matches i18n/
npm run check:locales  # parity, orphans, unexpected locale dirs, link locale
npm run check:content  # no starter residue, no placeholders
npm run check:publish  # only locale pages can become published URLs
npm run validate       # mint validate
npm run links          # mint broken-links (internal links)
npm run a11y           # mint a11y (color contrast and alt text)
```

All of these must pass before a change is merged.
