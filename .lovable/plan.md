
## What I can do (all of it, with one caveat)

This is a static multi-page site (plain HTML + vanilla JS, no SPA router). Every item on your list is doable except **Page Transitions** in the strict SPA sense — without a router, "route change" transitions can only be faked as an outgoing fade + link navigation (browser then loads the next page fresh). The overlay-wipe variant works well this way; a true GSAP Flip shared-element morph across pages does not, because the DOM is discarded on navigation.

Verdict: **10 of 11 fully, 1 partially.**

| # | Effect | Status | Where I'll apply it |
|---|---|---|---|
| 1 | Subtle button/card hover (lift + fade, 150ms) | Full | All `.btn`, nav links, small chips, icon tiles |
| 2 | Standard card hover (scale + shadow, 250ms) | Full | Service cards, condition cards, insurance tiles, testimonials |
| 3 | Magnetic / 3D tilt hover | Full | Hero visual panel + hero primary CTA only |
| 4 | Subtle scroll fade-in | Full | Section intros, eyebrows, headings (replaces current CSS reveal) |
| 5 | Staggered slide-up on scroll | Full | Services grid, insurance strip, why-us items, conditions chips |
| 6 | Scroll pinning / scrollytelling | Full | Home "Why Abhaya" 3-step section (pin + step through) |
| 7 | Staggered list/grid entrance | Full | Conditions chips, FAQ items, footer columns |
| 8 | Bento wave stagger (scale + back.out) | Full | Home services dark grid, services/index cards |
| 9 | Page transitions | **Partial** — outgoing fade + overlay wipe on link click; no shared-element morph across pages |
| 10 | Background parallax (scrub) | Full | Hero blobs, section blobs, footer accent |
| 11 | Skeleton shimmer + morphing spinner loader | Full | Intake form submit state, contact form submit state |

## How I'll build it

1. **Add GSAP via CDN** in every HTML page (`gsap.min.js` + `ScrollTrigger`). ~35 KB gz, no build step needed.
2. **New file `assets/js/motion-gsap.js`** — one module that:
   - Reads `prefers-reduced-motion` and no-ops if set.
   - Auto-wires behaviors from data attributes so pages stay declarative:
     - `data-hover="subtle" | "card" | "magnetic"`
     - `data-reveal="fade" | "slide-up"` (upgrades existing markup)
     - `data-stagger="list" | "bento"`
     - `data-parallax="0.15"` (speed)
     - `data-pin` (for the scrollytelling section)
     - `data-transition-link` on `<a>` (outgoing fade before navigation)
   - Provides a small `Loader` helper (`shimmer`, `dots`) used by intake/contact JS.
3. **Retire the overlapping bits of `assets/js/motion.js` / `reveal.js`** for reveals & parallax to avoid double-animating. Keep marquee, counter, header-mode, split-text there.
4. **Sprinkle data-attributes** onto the existing markup — no structural HTML changes, no restyle. Cards keep their look; hover just adds motion.
5. **Scrollytelling pin** on the home "Why Abhaya" section: pin the media column, advance the 3 numbered items as the user scrolls. Falls back to normal stacked layout under reduced-motion or narrow viewport (<900px).
6. **Page transition**: intercept same-origin `<a>` clicks, run a 220ms teal overlay wipe + main fade-out, then `location.href = href`. Incoming page fades main in on load. No history hacks, no SPA.
7. **Loader states** on intake/contact submit: swap button label for a 3-dot GSAP timeline; render skeleton shimmer rows if a section is awaiting data (currently only submit → success, so mainly the dots spinner).

## Scope guardrails

- Motion only. No copy, layout, palette, or component-structure changes.
- All effects gated by `prefers-reduced-motion: reduce`.
- Magnetic tilt only on fine pointers (desktop), never on touch.
- Pinning only on ≥900px viewports.

## Files touched

- New: `assets/js/motion-gsap.js`
- Edited: every `.html` file — add GSAP CDN + `motion-gsap.js` script tags, add data attributes to existing hero/cards/sections
- Edited: `assets/js/motion.js` — remove reveal + parallax responsibilities (kept elsewhere)
- Edited: `assets/js/intake.js`, `assets/js/contact.js` — hook submit → loader helper
- Edited: `assets/css/motion.css` — add `.loader-dot`, `.skeleton`, `.page-wipe` styles

Want me to build all 11 as scoped, or trim (e.g. skip scrollytelling pin or page-transition wipe)?
