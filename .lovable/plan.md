
# Abhaya Behavioral Health — Audit & Implementation Plan

## 1. Audit findings

### Critical (compliance / trust risk)
1. **Fabricated testimonials still live.** `assets/js/quote-wall.js` and `testimonials.html` present anonymized stories in a card/modal pattern that reads as patient reviews. Even with disclaimers, the "Care" nav label + modal author fields (`quote-modal-author`, `quote-modal-role`, `quote-modal-context`) mimic a review UI. Must be reframed as "Our care principles" with no author/role/context slots.
2. **Unverified HIPAA compliance claim.** `index.html:335` — "Secure, HIPAA-compliant video consultations". Website cannot self-assert HIPAA compliance; must be softened to "confidential telehealth using a HIPAA-aligned platform" or similar factual phrasing.
3. **Web3Forms simulation on localhost.** `assets/js/contact.js` / `intake.js` simulate success without a backend. Per brief, must never simulate success; must show a graceful "online submission temporarily unavailable — please call/email" fallback until access key is configured server-side.
4. **Intake form collects sensitive data** (checkbox `consent_hipaa`, symptom fields, medication text areas per intake.html line counts). Needs minimization — public unverified form should collect name, contact, best time, and short reason only.

### High (design system / consistency)
5. **Duplicate/legacy CSS.** `home-v2.css` (1285 lines) + `pages.css` (1528) + `components.css` (2185) contain overlapping hero, card, and carousel definitions. Two carousel implementations (`insurance-carousel.js` + `.logo-marquee`) exist; `insurance-carousel.js` is now unused.
6. **Two motion engines running.** `motion.js` (249) + `motion-gsap.js` (290) + GSAP CDN load on every page. GSAP only needed for a few pages; motion.js reveal duplicates GSAP ScrollTrigger reveals.
7. **Duplicated inline SVG icons** across every page (`quote-card__mark` repeats 8× per page). Should use `<use href="assets/img/icons/sprite.svg#...">`.
8. **Nav/footer drift risk.** Nav duplicated verbatim across 15 HTML files — must be verified identical, active states use `aria-current="page"` consistently.

### Medium (a11y / perf)
9. Lime `#bbd639` on cream fails AA for small text; needs audit of any small-text usage.
10. Fonts loaded via `<link rel="preload" as="style">` without `onload` swap — no benefit, and Fraunces weight range is broad; subset to used weights.
11. `data-split-text="words"` runs on every page's hero H1; if JS fails, text still renders (good), but motion should be gated behind `prefers-reduced-motion`.
12. `404.html` uses full editorial hero; verify it loads no GSAP unnecessarily.
13. `.htaccess` is minimal — missing cache headers, security headers (X-Content-Type-Options, Referrer-Policy), and gzip.

### Low
14. `og:image` points to `og-default.svg` — most social platforms don't render SVG OG images; needs a raster fallback (or accept degraded preview).
15. `sitemap.xml` includes `testimonials.html` — will need URL update when renamed.
16. `build.js` excludes `src/` and `node_modules` but not `.github`, `.lovable`, `.workspace`, `.prettierrc`, `.prettierignore`, `bun.lock`, `.gitignore`, `README*`. Must be widened.

## 2. Design system decisions (no code yet)

- Keep tokens: teal `#07abce`, lime `#bbd639`, cream `#F4F9FB`, ink `#2a3a40`, Fraunces + Plus Jakarta Sans.
- Lime restricted to: numbered markers, small icon accents, illustration highlights. Never body text on cream.
- Consolidate to **one** hero pattern (`hero-editorial`), **one** card pattern, **one** carousel (`logo-marquee`), **one** reveal system (IntersectionObserver in `motion.js`), GSAP retained only for the About sticky-approach sequence.
- Icons: single `sprite.svg` referenced via `<use>`; remove per-page inline SVG duplication for repeating marks.

## 3. Implementation sequence (phased, reviewable)

**Phase A — Compliance & content safety (do first, blocks publish)**
- Rewrite `testimonials.html` as `care.html` ("Our care principles") — remove author/role/context fields, remove quotation-mark visual, remove modal or repurpose to expanded principle text only.
- Update all nav/footer/sitemap references: label "Care", href `care.html`, drop from testimonials wording.
- Fix HIPAA phrasing on `index.html` and any other page.
- Rework `contact.js` / `intake.js`: remove localhost simulation; if `access_key` empty → show "Online form temporarily unavailable — call (573) 403-3544 or email contactus@abhayabh.com" and keep phone/email as primary CTAs.
- Minimize `intake.html` fields to non-PHI (name, phone, email, preferred contact, brief note, adult/minor, insurance name only — no member ID, no medication list, no symptom details).

**Phase B — Design system cleanup (no visual regressions)**
- Delete `insurance-carousel.js` (unused).
- Move all repeated inline SVG marks to `sprite.svg`; replace with `<use>`.
- Merge overlapping hero/card/carousel CSS; keep single source in `components.css` (base) + `home-v2.css` (home-only) + `pages.css` (subpage-only). Remove dead selectors validated by grep.
- Reduce GSAP loading to only About page; other pages use `motion.js` reveal.
- Widen `build.js` EXCLUDE list; add `.htaccess` cache/security headers.

**Phase C — Premium page refinements**
- **Home**: quieter hero (single kinetic word, static fallback), founder intro block with accessible video modal wired but showing "Video coming soon" state (no fake play), 4-step "What to expect" timeline (Request → Intake → First visit → Ongoing care), standardized services grid, care-principles teaser linking to `/care.html`, trust strip (verified only), crisis band, footer.
- **About**: keep sticky approach, tighten copy, ensure Dr. Yerrapu naming.
- **Services (overview + 3 detail pages)**: unified card layout, consistent icon per service, single CTA pattern, clear scope statements.
- **Conditions**: accessible `<details>` list with educational disclaimer; no self-assessment scoring.
- **Insurance**: `.logo-marquee` as text pills until logos supplied; clean steps list (no double numbering).
- **FAQ**: existing accordion audited for a11y (already uses `<details>`, good).
- **Contact / Intake**: per Phase A.
- **Privacy / Accessibility**: content review only, formatting to match system.
- **404**: original lightweight SVG, standard header/footer, links to Home/Services/Contact/Intake.

**Phase D — QA**
- Manual page walkthrough at 320/375/768/1024/1440 via Playwright screenshots.
- Keyboard, reduced-motion, 200% zoom checks.
- `node build.js` → inspect `dist/` for stray files.
- Verify all internal links, tel:/mailto:.

## 4. Items I will NOT do without your confirmation

- **Deleting `testimonials.html`** vs renaming to `care.html` with 301-style redirect note (static host — needs `.htaccess` `Redirect` rule). Please confirm rename.
- **Removing the modal** on the care page entirely, or keeping it to expand principle text only.
- **Intake field list**: I'll cut to the minimal set above unless you specify additional fields you want kept.
- **GSAP removal from Home**: I'll keep only reveal + one word kinetic; confirm you're OK losing any current GSAP flourishes on home.

## 5. Assets I still need from you

1. Verified phone number confirmation (repo shows `(573) 403-3544` — confirm correct).
2. Dr. Yerrapu portrait (JPG/PNG, ≥800×1000) and 30-90s intro video (MP4 + captions .vtt) when ready.
3. Verified credentials list (degrees, board certifications, licenses, affiliations).
4. Verified insurance carrier list + logo files (SVG preferred).
5. Confirmation of telehealth scope (Missouri only, or additional states).
6. Confirmation of age scope (adults only? adolescents? minimum age).
7. Any documented, authorized patient testimonials (only if legally cleared).

## 6. Deliverable on completion

Full changed-files list, page-by-page change log, a11y/security/perf check summary, unresolved verification items, and `dist/` contents ready for GoDaddy upload.

---

**Please confirm** the four decisions in §4, then I'll implement in the phase order above. If you want to skip any phase or reorder, tell me now.
