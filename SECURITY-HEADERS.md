# Security headers and Content Security Policy

This document explains every header shipped in `.htaccess`, why it is there, and
how to roll it back if GoDaddy's Apache rejects it.

`.htaccess` is an **Apache** file. It is read by GoDaddy Web Hosting Economy
(Linux + cPanel). It is completely inert on GitHub Pages, so the same `dist/`
folder is safe to publish in both places.

---

## 1. What ships, and why

| Header | Value | Why |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | Stops browsers from re-interpreting a `.txt` or image as HTML/JS. |
| `X-Frame-Options` | `SAMEORIGIN` | Legacy clickjacking defence for browsers that ignore CSP `frame-ancestors`. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Never leaks the full URL of a page a visitor was reading to a third party. Matters on a behavioral-health site where the path itself is sensitive. |
| `Permissions-Policy` | camera, microphone, geolocation, payment, USB all `()` | Denies powerful browser APIs the site never uses. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates our browsing context from windows we open. |
| `Cross-Origin-Resource-Policy` | `same-site` | Stops other origins from embedding our assets. |
| `Content-Security-Policy` | see below | Main defence against cross-site scripting. |

### Deliberately **not** enabled

- **`Strict-Transport-Security` (HSTS).** Commented out. HSTS is sticky: once a
  browser sees it, that browser refuses plain HTTP to the domain for the whole
  `max-age`. If the certificate is misconfigured at cutover the site becomes
  unreachable and you cannot undo it from the server. Enable it only after
  step 6 of the deployment checklist confirms HTTPS works on the live domain
  with no mixed-content warnings. Uncomment the line, start at
  `max-age=300`, and raise it once you are confident.
- **`unsafe-eval`.** Never added. No dependency needs it.
- **`unsafe-inline` for scripts.** Never added. All JavaScript is in external
  files under `assets/js/`.

---

## 2. The CSP, directive by directive

```
default-src  'self'
base-uri     'self'
object-src   'none'
frame-ancestors 'self'
form-action  'self' https://api.web3forms.com
script-src   'self' https://cdn.jsdelivr.net
style-src    'self' 'unsafe-inline' https://fonts.googleapis.com
font-src     'self' https://fonts.gstatic.com data:
img-src      'self' data: https:
connect-src  'self' https://api.web3forms.com
frame-src    https://www.google.com https://maps.google.com
upgrade-insecure-requests
```

| Directive | Why this value |
| --- | --- |
| `default-src 'self'` | Everything not named below may only load from our own domain. |
| `base-uri 'self'` | Blocks an injected `<base>` tag from re-pointing every relative URL. |
| `object-src 'none'` | No Flash/Java/embed plugins, ever. |
| `frame-ancestors 'self'` | The modern clickjacking control. Nobody may iframe the site. |
| `form-action` | Forms may post to our own domain, plus Web3Forms **when it is activated**. Leave the Web3Forms entry in place; a form action that is never used costs nothing. |
| `script-src` | `'self'` covers `assets/js/*`. `cdn.jsdelivr.net` is required by the GSAP animation library used on `about.html` only. No `'unsafe-inline'`: all inline scripts were extracted into external files precisely so this could stay strict. |
| `style-src` | `'unsafe-inline'` is still required because a handful of layout values are set through inline `style` attributes. Google Fonts serves its stylesheet from `fonts.googleapis.com`. |
| `font-src` | Font binaries come from `fonts.gstatic.com`; `data:` covers small inlined icon fonts. |
| `img-src 'self' data: https:` | Permissive on purpose: insurer logos are uploaded by the practice and may be hosted anywhere. Images cannot execute code, so this is low risk. |
| `connect-src` | `fetch()` may only reach our own origin and Web3Forms. |
| `frame-src` | Only the Google Maps embed on `contact.html`. |
| `upgrade-insecure-requests` | Rewrites any stray `http://` sub-resource to `https://`. |

### If you remove a third party, tighten the CSP

- Drop the GSAP animation from `about.html` -> remove `https://cdn.jsdelivr.net`
  from `script-src`.
- Self-host the fonts -> remove both Google Fonts origins and `data:`.
- Remove the Maps embed -> change `frame-src` to `'none'`.
- Decide against Web3Forms -> remove it from `form-action` and `connect-src`.

---

## 3. Rollback procedure

A bad `.htaccess` directive produces **HTTP 500 on every page**, including the
cPanel-served error page. Apache reads `.htaccess` on each request, so recovery
is immediate once the file is fixed. There is no cache to clear and no service
to restart.

**Before you upload a changed `.htaccess`, keep a copy of the working one.**

If the site returns 500 after an upload:

1. Log in to cPanel -> **File Manager** -> `public_html`.
2. Click **Settings** (top right) and tick **Show Hidden Files (dotfiles)**,
   otherwise `.htaccess` is invisible.
3. **Fastest fix:** rename `.htaccess` to `htaccess.broken`. The site comes back
   instantly with no custom headers. This is safe as an emergency measure, but
   the site is then unprotected, so do not leave it overnight.
4. **Proper fix:** restore your saved copy, or delete only the block you just
   added. The `<IfModule mod_headers.c>` wrapper already means the whole header
   block is skipped if `mod_headers` is unavailable, so headers are rarely the
   cause; `Redirect`, `RewriteRule` and `Options` lines are the usual culprits.
5. Reload the site in a private window and confirm a 200 response.
6. If you cannot identify the bad line, upload the known-good `.htaccess` from
   `dist/` in the repository. It is regenerated on every build.

**Isolating a single directive:** comment it out with a leading `#`, upload,
reload. Apache re-reads the file per request, so each test takes seconds.

---

## 4. Verifying the headers are live

After deployment, from any machine:

```bash
curl -sSI https://www.abhayabh.com/ | grep -i -E 'content-security|x-frame|x-content|referrer|permissions'
```

Every header listed in section 1 should appear exactly once. If nothing appears,
`mod_headers` is not enabled on the hosting plan; open a GoDaddy support ticket
before assuming the file is wrong.

Then open the site in Chrome, press F12, and check the **Console**. A CSP that
is too strict shows as `Refused to load ...` messages. Each one names the
directive to widen. Do not fix these by adding `'unsafe-inline'`; add the
specific origin instead.
