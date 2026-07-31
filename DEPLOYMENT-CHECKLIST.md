# Deployment checklist — Abhaya Behavioral Health

Target: **GoDaddy Web Hosting Economy (Linux + cPanel)**, uploading to
`public_html/`.

Work top to bottom. Do not skip section 1.

---

## 1. Before you upload

- [ ] Pull the latest code and install dependencies: `npm ci`
- [ ] Run the full gate: `npm run prelaunch`
      It must finish with no failures. It runs, in order: dependency audit,
      build, content/encoding check, link and asset check, HTML validation,
      form unit tests, accessibility tests, responsive tests, and the
      production-bundle check.
- [ ] Confirm `DIST-MANIFEST.txt` was regenerated and the file count looks
      sensible (no stray files, no `.map`, no `.md`).
- [ ] Confirm the fax number on the site is **(573) 303-3544**. The build fails
      automatically if a retired number reappears.

### Content sign-off (not automatable)

- [ ] A clinician has approved every clinical statement on `services/*`,
      `conditions.html` and `care.html`.
- [ ] Someone has confirmed the insurer list on `insurance.html` matches current
      contracting.
- [ ] Office hours, address, phone, fax and email are correct.
- [ ] `UNRESOLVED-CONTENT.md` has been reviewed and nothing in it is blocking.

---

## 2. Upload

- [ ] cPanel -> **File Manager** -> `public_html`.
- [ ] **Settings** -> tick **Show Hidden Files (dotfiles)**. Without this you
      will not see `.htaccess` and will silently deploy without security headers.
- [ ] Upload the **contents of `dist/`**, not the `dist` folder itself.
      `public_html/index.html` must exist, *not* `public_html/dist/index.html`.
- [ ] Confirm `public_html/.htaccess` is present.
- [ ] Keep a copy of the previous `.htaccess` somewhere safe before overwriting.

---

## 3. Immediately after upload

- [ ] Load `https://www.abhayabh.com/` — homepage renders, logo and fonts load.
- [ ] Click through all 15 pages from the navigation. No 404s.
- [ ] Visit a deliberately wrong URL, e.g. `/nope` — the custom 404 page shows.
- [ ] Visit `/testimonials.html` — it should redirect to `/care.html`.
- [ ] Check `/robots.txt` and `/sitemap.xml` load and reference the live domain.
- [ ] Open the mobile menu on a real phone. It opens, closes, and Escape works.
- [ ] Check the insurer logo carousel scrolls and the arrows move it.

---

## 4. Security headers

- [ ] Run:
      `curl -sSI https://www.abhayabh.com/ | grep -i -E 'content-security|x-frame|x-content|referrer|permissions'`
      All five headers appear.
- [ ] Open Chrome DevTools -> Console on the homepage, `about.html` and
      `contact.html`. There must be **no** `Refused to load` CSP errors.
      `about.html` exercises the GSAP CDN; `contact.html` exercises the Maps
      iframe. Those two are the pages a CSP mistake will break.
- [ ] If any page 500s, follow the rollback procedure in `SECURITY-HEADERS.md`
      section 3.

---

## 5. HTTPS

- [ ] The site loads over `https://` with a valid certificate.
- [ ] `http://` redirects to `https://`.
- [ ] No mixed-content warnings in the console on any page.
- [ ] Both `abhayabh.com` and `www.abhayabh.com` resolve and serve the same site.
- [ ] **Only after all of the above pass:** enable HSTS by uncommenting the
      `Strict-Transport-Security` line in `.htaccess`. Start at `max-age=300`,
      verify, then raise it. Read the warning in `SECURITY-HEADERS.md` first —
      HSTS cannot be undone from the server side.

---

## 6. Forms

Both forms are intentionally **inactive**. Confirm that is still what you want.

- [ ] Submitting the contact form does **not** claim success without delivering.
      With no access key it falls back to the visitor's email client.
- [ ] Contact form: to activate, obtain a Web3Forms access key and paste it into
      the hidden `access_key` input in `contact.html`. Then send a real test
      submission and confirm it arrives at `contactus@abhayabh.com`.
- [ ] Intake form: **leave inactive.** Do not add an access key until the
      practice has a written HIPAA/BAA determination. See
      `THIRD-PARTY-AUDIT.md` section 3.

---

## 7. Search engines

- [ ] Every page has a unique `<title>` and meta description (checked by the
      build, but eyeball the homepage and services pages).
- [ ] Submit `https://www.abhayabh.com/sitemap.xml` in Google Search Console.
- [ ] Confirm `robots.txt` does not disallow anything you want indexed.
- [ ] Verify the Google Business Profile address matches `contact.html`.

---

## 8. Manual checks the automated suite cannot do

The automated suite covers Chromium at four viewport widths, axe accessibility
on all 15 pages, link integrity and HTML validity. It does **not** cover:

- [ ] **Real Safari**, on a real iPhone and a real Mac. The test suite's WebKit
      coverage is the WebKit *engine*, which is not the same as Safari.
- [ ] A real Android device in Chrome.
- [ ] **A screen reader.** Run VoiceOver (Mac/iOS) or NVDA (Windows) through the
      homepage, the mobile menu, and the intake form. Automated tools catch
      roughly a third of accessibility problems.
- [ ] Keyboard-only navigation of the whole site, watching for a visible focus
      ring at every stop.
- [ ] Printing a page — the print stylesheet hides navigation and the crisis
      band; confirm the result is readable.
- [ ] Reading the site at 200% and 400% browser zoom on a real laptop.
- [ ] Colour perception: confirm nothing communicates meaning by colour alone.
- [ ] Sending a real email to `contactus@abhayabh.com` and confirming someone
      receives and monitors it.
- [ ] Calling the office number and the fax number to confirm both are live.
- [ ] Confirming the crisis notice content (911, 988) is exactly what the
      practice wants to publish.

---

## 9. Rollback

If the deployment is bad and you need the previous site back:

1. Restore the previous `public_html` contents from your backup, or from
   cPanel's **Backup** / **JetBackup** restore point.
2. If only the headers are broken, rename `.htaccess` to `htaccess.broken` —
   the site returns instantly, unprotected, while you investigate.
3. Re-run `npm run prelaunch` locally against the reverted commit before trying
   again.
