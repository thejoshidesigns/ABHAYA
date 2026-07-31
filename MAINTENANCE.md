# Website maintenance guide

A plain-language guide for keeping the Abhaya Behavioral Health website
accurate and safe. **You do not need to be a developer to use this.** Where a
task does need a developer, it says so.

---

## How the website works, in one paragraph

The site is a set of plain web pages. There is no database and no login. Every
page you see is a file. A small "build" step takes the source files, stitches in
the shared pieces (the top bar, the menu, the footer, the crisis notice), and
puts a finished, upload-ready copy in a folder called `dist`. Whatever is in
`dist` is exactly what visitors see. Because there is no database, the site is
fast, cheap, and has very little that can be attacked.

---

## The golden rules

1. **Never edit files directly on the web server.** Your change will be wiped
   out the next time anyone publishes. Change the source, rebuild, re-upload.
2. **Never hand-edit the top bar, menu, footer or crisis notice inside a page.**
   Those live in one shared file each. Editing one page's copy makes the site
   inconsistent. See "Changing something that appears on every page" below.
3. **Always run the quality check before publishing.** One command. It catches
   broken links, missing images, accessibility problems and out-of-date phone
   numbers.
4. **Do not put patient information anywhere in the website files**, including
   testimonials, screenshots and example form entries.

---

## Common jobs

### Change text on one page

Each page has a matching file:

| Page on the site | File to edit |
| --- | --- |
| Home | `index.html` |
| About | `about.html` |
| Services | `services/index.html` |
| Conditions | `conditions.html` |
| Insurance | `insurance.html` |
| Client stories | `care.html` |
| FAQ | `faq.html` |
| Contact | `contact.html` |
| Appointment request | `intake.html` |

Open the file, find the words you want to change, and change only the words —
leave anything inside angle brackets `< >` alone. Save, then follow
"Publishing a change".

### Changing something that appears on every page

These live in the `partials/` folder. Edit the one file and every page updates
when you rebuild.

| What | File |
| --- | --- |
| Phone / hours strip at the very top | `partials/topbar.html` |
| Logo and main menu | `partials/header.html` |
| Footer, address, fax, copyright | `partials/footer.html` |
| Crisis / emergency notice | `partials/crisis.html` |

### Update the phone, fax, address or email

1. Edit `partials/topbar.html` and `partials/footer.html`.
2. Also search the whole project for the old number, because it may appear in
   the machine-readable business details that Google reads. A developer can do
   this in seconds.
3. Rebuild. The build **deliberately fails** if a retired fax number reappears —
   that guard is in `scripts/check-contact.js`. If you change the fax number
   permanently, ask a developer to update that guard too.

### Add or change insurer logos

Drop the image files into `assets/img/insurers/` and reference them in
`insurance.html` and `index.html`.

**Logo specification:** 200 x 80 pixels, SVG preferred, otherwise transparent
PNG at 2x (400 x 160). Transparent background, trimmed of empty space. The
carousel converts them to grey automatically, so full-colour originals are fine.

### Add a new page

This needs a developer. A new page has to be added to the menu, the sitemap and
the link checker.

---

## Publishing a change

You need Node.js installed once. Then, in a terminal, in the project folder:

```bash
npm ci          # only needed the first time, or after a developer updates things
npm run prelaunch
```

`prelaunch` builds the site and runs every check. **If it reports a failure,
stop.** Do not publish. Read the message — it names the file and the problem —
or send it to a developer.

If it passes, upload the **contents** of the `dist` folder into `public_html`
on GoDaddy, following `DEPLOYMENT-CHECKLIST.md`. That checklist also tells you
what to click through afterwards.

### Just want to see your change locally first?

```bash
npm run build
npm run serve
```

Then open the address it prints in your browser. You must **build first** —
opening the source `index.html` directly will show the page without its menu and
footer, because those are stitched in during the build.

---

## The commands, explained

| Command | What it does |
| --- | --- |
| `npm run build` | Stitches the shared pieces in and writes `dist/`. |
| `npm run serve` | Views the built site in your browser. |
| `npm run check` | Runs all the automated checks without publishing. |
| `npm test` | Runs the accessibility and layout tests. |
| `npm run prelaunch` | Everything above, in order. **Run this before every publish.** |

---

## What the checks protect you from

- **Content check** — placeholder text ("TODO", "lorem ipsum"), broken accented
  characters, and stale contact details slipping into a live page.
- **Link check** — a menu item or button pointing at a page or image that does
  not exist.
- **HTML validation** — malformed markup that renders differently in different
  browsers.
- **Accessibility tests** — automated WCAG 2.1 AA checks on all 15 pages, at
  phone and desktop sizes. This matters legally and ethically for a healthcare
  site.
- **Layout tests** — pages that scroll sideways or break on a small phone.
- **Bundle check** — makes sure nothing private (tests, internal notes, tooling)
  ends up on the public server, and that `.htaccess` is included.

---

## Things to leave alone

Do not edit these without a developer:

- `.htaccess` — the security settings. A single wrong character makes the whole
  site return an error. Recovery steps are in `SECURITY-HEADERS.md`.
- Anything in `scripts/`, `tests/`, or `build.js`.
- `package.json` and `package-lock.json`.
- `dist/` — it is regenerated from scratch on every build. Editing it does
  nothing lasting.

---

## The forms

Both forms are currently **switched off** for real delivery. When someone
submits one, it opens their own email program with the details filled in rather
than sending anything from the website.

- The **contact form** can be switched on whenever you like, by getting a
  Web3Forms access key and pasting it into `contact.html`.
- The **appointment request form** must stay off until the practice has written
  confirmation that the form provider will sign a Business Associate Agreement
  and that the setup meets HIPAA requirements. This is a compliance decision,
  not a technical one. Details in `THIRD-PARTY-AUDIT.md`.

---

## Routine schedule

**Monthly**
- Click through every page and check nothing looks broken.
- Confirm the phone, fax, hours and address are still correct.
- Confirm the insurer list still matches what the practice accepts.

**Quarterly**
- Run `npm audit` and pass the output to a developer.
- Re-read the crisis notice and confirm 911 and 988 are still what you want.
- Check outbound links still work, especially the CMS medical-bill-rights link
  on the insurance page.

**Yearly**
- Review clinical content with a clinician.
- Ask a developer to review `THIRD-PARTY-AUDIT.md` and update dependencies.
- Confirm the SSL certificate renewed (GoDaddy usually does this automatically).

---

## Getting help

When something is wrong, a developer will want:

1. The page address where it happens.
2. The device and browser.
3. A screenshot.
4. The full text of any error from `npm run prelaunch`.

Longer reference documents, all in the project folder:

- `DEPLOYMENT-CHECKLIST.md` — step-by-step publishing.
- `SECURITY-HEADERS.md` — what the security settings do and how to undo them.
- `THIRD-PARTY-AUDIT.md` — which outside services the site touches.
- `UNRESOLVED-CONTENT.md` — content questions still awaiting an answer.
