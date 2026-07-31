## Scope

Static site (plain HTML/CSS/JS, `build.js` copies to `dist/`, `scripts/check-contact.js` guards contact data). No framework migration. New tooling is devDependencies only, installed against the existing lockfile, never shipped to `dist/`.

Eight phases, run **one at a time**. After each phase I report files changed, tests run, and unresolved concerns, and I stop if the build fails or if a change would alter visible clinical content without your approval.

---

## Phase 1 — Content additions (insurance + contact)

**Good Faith Estimate (`insurance.html`)**
- New `<section id="good-faith-estimate">` between the self-pay section and "How to verify your coverage", using the existing `.section` / `.section__head` pattern (no card inside a card).
- Exactly the five approved statements, plus a link to the CMS page with `rel="noopener noreferrer"`.
- No claim the site generates or delivers estimates; no invented procedures, codes, deadlines or guarantees.

**FAQ (`faq.html`)**
- The "What is a Good Faith Estimate?" answer links to `insurance.html#good-faith-estimate`; the matching JSON-LD text stays consistent with the visible answer.

**Crisis notice (`contact.html`)**
- Compact `<aside role="note">` directly after the hero, before contact details: states the site and contact form are not monitored for emergencies, `tel:911` for immediate danger, call/text 988 links for mental-health crisis.
- Static styling only, AA contrast, legible at 320px and 200–400% zoom. The full 988 section near the footer is untouched.

## Phase 2 — Encoding and placeholder audit

- `scripts/check-content.js`: flags mojibake (`Ã`, `â€`, `Â`), U+FFFD, stray control chars, and placeholders (`TODO`, `TBD`, `lorem ipsum`, `example.com`, `FIXME`, empty `href="#"` stubs). Non-zero exit on a hit.
- Fix real encoding defects; all files remain UTF-8.
- Uncertain factual content is never invented. It goes into `UNRESOLVED-CONTENT.md`: file, location, what needs client confirmation. This file contains **no** patient information, credentials or private client discussion, is git-tracked but **excluded from `dist/`**, as are all QA reports.

## Phase 3 — Testimonials / care stories

- Audit `care.html`, `index.html` and any other page carrying stories.
- Without documented patient authorization and approved final wording: remove attributions, names, photographs, star ratings and treatment-outcome claims.
- Anything retained is rewritten as a clearly and visibly labelled illustrative care scenario ("Illustrative scenario, not an actual patient experience"), with the label adjacent to the content, not buried in a footnote.
- Removed items are logged in `UNRESOLVED-CONTENT.md` for client decision.

## Phase 4 — Build-time partials + local preview

Extend `build.js` (plain Node, no runtime deps, no framework):
- `partials/` holds top bar, header/nav, mobile menu, crisis section, footer. Pages use `<!-- @include header -->` markers; the build injects full markup, so `dist/` is complete static HTML with **no client-side nav or footer injection**.
- Depth token (`{{base}}` → `` or `../`) gives correct relative links for root pages and `services/*`; per-page active state sets `aria-current="page"` and the active nav class. ARIA attributes, mobile menu behavior and keyboard handling are preserved verbatim from current markup.
- Page `<head>`, titles, descriptions and JSON-LD stay in individual page files.

**Local preview**
- Source pages now contain include markers, so they must never be served raw. `npm run dev` is changed to build first and serve `dist/`; `npm start` keeps serving `dist/` as today. A `npm run preview` (build + serve, with a watch-rebuild option) is the reliable everyday command.

**Verification**
- Build asserts each generated page has exactly one `<header>`, one `<main>`, one `<footer>`.
- Before/after equivalence is checked by **DOM and behavioral comparison**, not byte diffs: parse pre-refactor and post-refactor `dist/` pages, compare normalized element trees (tag, attributes, text) per page, then run the Playwright suite from Phase 7 against both.

**Deployment**
- The existing GitHub Pages workflow already builds and publishes `dist/`; it is preserved and re-verified after the refactor. Normal workflow files are not deleted.

## Phase 5 — Conservative dead-code cleanup

- Inventory every CSS selector and JS function; cross-reference HTML, partials and JS-constructed class strings before removing anything.
- Preserve runtime-state classes (`is-active`, `is-visible`, `is-open`) and reduced-motion branches even when absent from static HTML.
- Consolidate duplicated reveal/carousel/motion code only where behavior is identical (`reveal.js` vs the reveal logic in `motion.js` is the main candidate).
- No automated CSS purge. CSS/JS byte sizes reported before and after; every page exercised afterwards.

## Phase 6 — Forms (both remain inactive for real delivery)

- **Contact form**: kept for non-sensitive general messages only. May later use Web3Forms; access key stays blank now.
- **Appointment Request / intake**: **not** wired to Web3Forms. It stays unconnected until the practice confirms in writing that the chosen service and configuration meet its HIPAA/BAA requirements. No documentation is presented claiming Web3Forms is BAA-covered.
- No diagnosis, medication, treatment-history or other sensitive free-text fields added or transmitted.
- Remove any path that reports successful delivery when nothing is configured. With no key, submission is blocked and an inline message points to phone/email.
- Accessibility: visible labels, helper text, required indicators, inline errors via `aria-describedby`, focus moved to the first invalid field, `aria-live="polite"` status region, submit locked during an in-flight attempt to prevent duplicates.
- Validation logic extracted into a testable module with Node built-in test-runner tests.
- Report of what remains before real delivery: contact form needs a key; intake form needs a written HIPAA/BAA determination first.

## Phase 7 — Automated checks, accessibility and responsive suites

- `scripts/check-links.js` + `html-validate` against `dist/`: internal links and `#fragments` resolve; images/CSS/JS/icons/favicon/downloads exist; relative paths validated from `services/*`; duplicate IDs and semantic validity checked. `tel:`/`mailto:`/external URLs are syntax-checked only, never fetched.
- Playwright + `@axe-core/playwright`, with **explicit `playwright install --with-deps` in the CI workflow**.
- Axe on every page (home, about, services overview and each service page, conditions, insurance, contact, intake, faq, privacy, accessibility, care, 404) at desktop and mobile widths; serious/critical findings fail. Any suppression carries a written justification.
- Interaction coverage: mobile menu open/close/Escape/focus return, FAQ accordion and filters, skip link, visible keyboard focus.
- Responsive suite at 320x568, 390x844, 768x1024, 1440x900: horizontal-overflow and overlap detection, header/footer/button/typography checks, reduced-motion mode, 200% zoom where automatable, screenshots saved. Chromium/Firefox/WebKit where supported — reported as **WebKit engine coverage only; real Safari and physical-device testing stay a separate manual launch check**.
- One documented command, `npm run check` (build then all checks), exiting non-zero on real defects.

## Phase 8 — Security headers, third-party audit, launch package, guide

- Inventory every external origin actually used (Google Fonts, Google Maps embed, jsDelivr/GSAP, Web3Forms endpoint); drop unused ones; self-host fonts (OFL permits it).
- `.htaccess` is GoDaddy-Apache-only and inert on GitHub Pages; it ships inside `dist/`. Directives validated as supported on shared hosting, CSP introduced conservatively after confirming every required origin, no `unsafe-eval`, `frame-ancestors 'self'`, plus `X-Content-Type-Options`, `Referrer-Policy`, conservative `Permissions-Policy`. **No HSTS** until production HTTPS is verified. A written **rollback procedure** (restore the prior `.htaccess`, or rename it, to recover from a 500) ships with it.
- Maps: the `?output=embed` iframe uses no API key; I'll recommend a click-to-load wrapper and implement it if you want it.
- `npm run prelaunch`: `npm audit` (never `--force`), build, HTML/link/asset checks, a11y tests, responsive tests, Lighthouse on representative pages with scores reported. Oversized images converted to WebP/AVIF with originals preserved, explicit width/height added, below-fold images lazy-loaded (hero eager).
- `dist/` verified as an upload-ready `public_html` payload: no `node_modules`, `.git`, sources, tests, docs, temp/editor files, secrets, source maps, and no `.claude`/`.codex`/AI instruction files, AI metadata, chat transcripts or Lovable branding anywhere in the repo or `dist/`. Generated file manifest plus deployment checklist. No DNS changes, no deployment claims.
- `MAINTENANCE.md`: one page, non-technical: contact info, hours/facilities, provider images, insurance info, building, what to upload to `public_html`, verifying forms once activated, checking sitemap/robots/HTTPS/404, and which content needs clinical or legal sign-off. No credentials.

---

## Technical notes

DevDependencies only, installed against the existing lockfile, no unrelated major-version upgrades: `@playwright/test`, `@axe-core/playwright`, `html-validate`, `lighthouse`, `sharp`. Everything else is plain Node scripts.

New npm scripts: `preview`, `check:content`, `check:links`, `check:html`, `test:a11y`, `test:responsive`, `check`, `prelaunch`.
