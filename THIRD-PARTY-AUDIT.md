# Third-party and privacy audit

Scope: everything the visitor's browser is asked to contact when it loads
`dist/`. Audited against the built output, not just the source.

**Headline: the site sets no cookies, runs no analytics, and has no
advertising, tag-manager, session-replay, heat-map or social tracking code.**
No visitor-identifying data leaves the site today.

---

## 1. Origins actually contacted

| Origin | Used on | Purpose | Sees visitor IP? | Verdict |
| --- | --- | --- | --- | --- |
| `fonts.googleapis.com` | all 15 pages | Google Fonts stylesheet (Plus Jakarta Sans, Fraunces) | Yes | **Keep, or self-host (recommended)** |
| `fonts.gstatic.com` | all 15 pages | Font binaries | Yes | Same as above |
| `cdn.jsdelivr.net` | `about.html` only | GSAP + ScrollTrigger 3.12.5, scroll animation | Yes, on that page | **Keep, pinned; self-host is better** |
| `www.google.com/maps` | `contact.html` only | Office location map iframe | Yes, on that page | **Keep, gate behind click-to-load** |
| `api.web3forms.com` | contact + intake form markup | Form delivery | Only if a form is submitted | **Currently inactive, see section 3** |
| `www.cms.gov` | `insurance.html` | Outbound text link to the federal medical-bill-rights page | Only if clicked | Fine |

### Origins that are *not* contacted

`schema.org` and `www.w3.org` appear in the markup but are namespace
identifiers inside JSON-LD and SVG. They are never fetched. `www.abhayabh.com`
is our own canonical domain.

### Removed since the last audit

`api.github.com` and `assets/js/github-sync.js` (a build-status widget) have
been deleted. That widget called a third-party API on every page load and had
no place on a patient-facing site.

---

## 2. Privacy assessment per third party

### Google Fonts — medium priority

Loading a font from `fonts.gstatic.com` sends the visitor's IP address and
user-agent to Google on **every page**, including the crisis-resources content
on the contact page. Nothing identifies the visitor by name, and Google states
it does not use Font requests for profiling, but a German court has previously
held that transmitting IP addresses to Google Fonts without consent breaches
GDPR. Our audience is Missouri-based, so GDPR exposure is low, but the fix is
cheap and removes the question entirely.

**Recommendation: self-host.** Both families are licensed under the SIL Open
Font License, which explicitly permits redistribution. Self-hosting also removes
two DNS lookups and two TLS handshakes from the critical path, which improves
Largest Contentful Paint. After self-hosting, delete both Google origins from
`style-src` and `font-src` in `.htaccess`.

*Not done in this pass* because it changes font loading on every page and should
be verified visually against each page's headings before launch.

### jsDelivr / GSAP — low priority

Third-party JavaScript is the highest-severity category of third party, because
a compromised CDN can execute arbitrary code in the page. Mitigations in place:

- The version is **pinned** (`gsap@3.12.5`), so the URL cannot silently serve a
  new release.
- It loads on `about.html` only, not site-wide.
- CSP restricts `script-src` to `'self'` plus this one origin.
- It is purely decorative. If it fails to load, `about.html` renders correctly
  with no animation.

**Recommended hardening:** add Subresource Integrity so the browser refuses a
tampered file, or download the two files into `assets/js/vendor/` and drop
jsDelivr from the CSP altogether. The self-hosted route is strictly better and
is the suggested launch action.

### Google Maps embed — medium priority

`contact.html` embeds a map via `?output=embed`, which needs **no API key** — so
there is no key to leak and no billing exposure. However, the iframe loads
Google code and cookies as soon as the page opens, before the visitor has done
anything.

**Recommended: click-to-load.** Replace the iframe with a static image of the
map plus a "Load interactive map" button that swaps in the iframe on click, and
a plain text address with a "Get directions" link that always works. Visitors
who only want the address never touch Google. This is a small, self-contained
change and is offered as a follow-up.

### Web3Forms — blocked pending sign-off

Not currently transmitting anything. See section 3.

---

## 3. Forms and protected health information

Both forms are **inactive for real delivery**. Neither has an access key
configured, and with no key the JavaScript will not POST anywhere.

- **Contact form** (`contact.html`) is intended for general, non-sensitive
  enquiries. It may be activated with a Web3Forms access key. The visible
  helper text tells people not to include medical details.
- **Appointment request / intake** (`intake.html`) collects information that is
  reasonably treated as PHI. It **must not** be wired to Web3Forms, or any other
  processor, until the practice has a **written determination that the vendor
  will sign a Business Associate Agreement** and that the configuration meets
  its HIPAA obligations. Web3Forms is not represented anywhere in this repository
  as being BAA-covered, because that has not been established.

Neither form adds diagnosis, medication or treatment-history fields.

Until a form is activated, submissions fall back to opening the visitor's own
email client with the details pre-filled. That keeps the message under the
visitor's control and means the site never brokers the data. Note that ordinary
email is not encrypted end to end; the contact page should continue to steer
anything clinical to the phone number.

---

## 4. Data the site stores

| Mechanism | Used? |
| --- | --- |
| Cookies | None set by the site |
| `localStorage` / `sessionStorage` | Not used |
| Analytics / pixels / tag managers | None |
| Third-party fonts, maps, CDN | As listed above |

Because no cookies are set and no analytics run, the site does not currently
need a cookie banner. **If analytics are ever added, that changes**, and the
privacy policy must be updated in the same change.

---

## 5. Prioritised recommendations

1. **Self-host Plus Jakarta Sans and Fraunces.** Removes two third parties from
   every page and speeds up first render. Then tighten the CSP.
2. **Self-host GSAP** (or add SRI). Removes the only remaining third-party
   script origin.
3. **Click-to-load the Google Map.** Removes Google from the contact page
   until the visitor asks for it.
4. **Do not activate the intake form** without the written HIPAA/BAA
   determination described above.
5. **Re-run this audit** whenever a new script, font, embed or pixel is added.
   `npm run check:dist` will fail the build if unexpected files appear, but it
   cannot detect a newly added remote origin — that check is manual.
