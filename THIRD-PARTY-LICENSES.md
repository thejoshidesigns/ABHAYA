# Third-party licenses

Abhaya Behavioral Health self-hosts every third-party asset it ships. This
file records what is bundled, under what terms, and where the full licence
text lives in this repository.

Keeping these records is a licence obligation. Do not delete them, and do not
strip the `@license` banners from the files in `assets/js/vendor/`.

---

## Fonts

Both families are served from `assets/fonts/` and declared in
`assets/css/fonts.css`. They were previously loaded from Google Fonts; the
`.woff2` files are the exact binaries Google's CSS API serves, so rendering is
unchanged.

### Fraunces

- Version: v38 (variable: `opsz` 9-144, `wght` 300-700, `SOFT` 0-100)
- Copyright 2018 The Fraunces Project Authors
  <https://github.com/undercasetype/Fraunces>
- Licence: SIL Open Font License 1.1
- Full text: [`assets/fonts/OFL-Fraunces.txt`](assets/fonts/OFL-Fraunces.txt)

### Plus Jakarta Sans

- Version: v12 (variable: `wght` 400-700)
- Copyright 2020 The Plus Jakarta Sans Project Authors
  <https://github.com/tokotype/PlusJakartaSans>
- Licence: SIL Open Font License 1.1
- Full text:
  [`assets/fonts/OFL-PlusJakartaSans.txt`](assets/fonts/OFL-PlusJakartaSans.txt)

**OFL notes.** The OFL permits bundling and self-hosting. It requires that the
copyright notice and licence travel with the font files, which is what the two
`OFL-*.txt` files above accomplish. The OFL does **not** require the notice to
appear in public page content, so no site page needs to display it. The
Reserved Font Name clause means these files must not be redistributed under a
changed name; we ship them unmodified.

---

## JavaScript

### GSAP 3.12.5 and ScrollTrigger 3.12.5

- Files: `assets/js/vendor/gsap.min.js`,
  `assets/js/vendor/ScrollTrigger.min.js`
- Used by: `assets/js/motion-gsap.js`, loaded on `about.html` only
- Copyright 2024 GreenSock. All rights reserved.
- Licence: GSAP Standard "No Charge" License
  <https://gsap.com/standard-license>

The GSAP npm package ships no separate `LICENSE` file. The licence notice is
the `@license` banner at the top of each `dist` file, reproduced here verbatim
from `gsap.min.js`:

```
/*!
 * GSAP 3.12.5
 * https://gsap.com
 *
 * @license Copyright 2024, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license or for Club GSAP
 * members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
 */
```

Both vendored files are byte-for-byte the published 3.12.5 builds, so those
banners are intact. **Do not minify, re-bundle or otherwise reprocess these
files in a way that strips the banner.**

**Scope check.** The Standard "No Charge" License covers use on a site like
this one, where the animation is part of the website and visitors are not
charged for access to it. Only the ScrollTrigger plugin is used, which is not
a Club GSAP bonus plugin. If the practice later adds a paid product,
membership area, or resells anything built on GSAP, re-read the licence terms
before shipping.

---

## Not bundled

`https://www.google.com/maps/embed` is loaded on `contact.html` only, and only
after the visitor presses "Load interactive map". Nothing from Google Maps is
stored in this repository, and the page's address and "Open in Google Maps"
link work with no embed loaded at all. See `THIRD-PARTY-AUDIT.md`.
