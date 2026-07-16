## Goal

Bring About, Services (index + 3 detail pages), Conditions, Insurance, FAQ, Contact, Intake, Accessibility, Privacy, and 404 in line with the home page — same hero rhythm, same cards, same spacing, same accent usage — without changing any copy or business content.

## What's inconsistent today

Reviewed every page against the home page. The building blocks (header, footer, buttons, fonts) already match. The drift is in **section-level patterns**:

- **Hero pattern.** Home uses a big serif headline with the *italic accent word* in warm-gold color (e.g. "healthier"). Insurance, Accessibility, and Contact follow this. About, Services, Services detail, Conditions, FAQ, and Intake use plain-ink headlines with no accent word — feels flatter.
- **Hero visual.** About / Services / Services detail have a large chair illustration on the right. Conditions / Insurance / FAQ / Accessibility / Contact leave the right side empty, so the hero looks unbalanced and the eyebrow floats. Needs a consistent lightweight decorative treatment (soft blob accent) for pages without a real hero image.
- **Eyebrow.** Home uses `WHY ABHAYA` / `WHAT WE OFFER` (no leading dash). Subpages use `—— SERVICE`, `—— ABOUT THE PRACTICE` with a leading dash. Pick one — standardize on the home style.
- **Card styling.** Services index uses `.soft-card` (rounded, soft blue, icon + title + copy + CTA). Contact uses similar cards but with different padding. Conditions uses bordered "condition-card". FAQ uses a plain bulleted list. Insurance carousel tiles use their own style. Standardize on the `.soft-card` shape (radius, padding, shadow, icon chip) and a lighter "list-card" variant for text-heavy grids.
- **Section rhythm.** Home sections use `padding: clamp(5rem,10vw,8rem) 0` and a consistent eyebrow → h2 → lede → grid rhythm. Some subpages use tighter padding and skip the eyebrow.
- **Image sizing.** The chair illustration renders at very different aspect ratios on About vs. Services vs. Medication. Cap it inside a `.page-hero__media` frame with a fixed max width and aspect ratio.

## What I'll change

Purely presentation — CSS classes and small markup swaps. No copy edits, no route changes, no JS changes.

### 1. Introduce shared page-level primitives (in `assets/css/pages.css`)

```
.page-hero              // two-column hero: text left, media right
.page-hero__eyebrow     // matches home eyebrow (no dash, teal, tracked)
.page-hero__title       // serif clamp(2.4rem, 5vw, 4rem)
.page-hero__title em    // italic accent word, warm-gold color
.page-hero__lede        // 1.05rem, muted ink, max 36ch
.page-hero__media       // aspect-ratio 4/3, max-width 30rem, soft cream frame
.page-hero__decor       // for pages with no hero image: subtle blob + circle mark, matches Why section

.section                // vertical rhythm wrapper, clamp(5rem,10vw,8rem) padding
.section__head          // eyebrow + h2 + lede stack, max 44rem, left-aligned
.section__grid--3       // 3-col responsive grid, gap 2rem, using .soft-card children
.section__grid--2       // 2-col responsive grid

.list-card              // text-heavy card: cream bg, 1.5rem radius, 1.75rem padding, hover lift
```

### 2. Migrate each page to those primitives

For each page I'll:
1. Wrap the hero in `.page-hero` and normalize eyebrow / title / lede.
2. Add `<em>` on one word in the headline where an italic accent fits (Conditions → "mental health", Services → "your life", FAQ → "first visit", About → "being seen", Intake → "first visit").
3. Replace bespoke cards with `.soft-card` or `.list-card` — same padding, radius, shadow, hover.
4. Wrap major content blocks in `.section` + `.section__head` for the same rhythm as home.
5. For pages with no real hero image, drop in `.page-hero__decor` (the same simplified circle-mark visual used in the Why section) so the hero never looks empty.
6. Cap the chair illustration to a single size on About / Services / Medication.

### 3. Pages touched

- `about.html`, `services/index.html`, `services/medication.html`, `services/psychotherapy.html`, `services/telepsychiatry.html`, `conditions.html`, `insurance.html`, `faq.html`, `contact.html`, `intake.html`, `accessibility.html`, `privacy.html`, `404.html`.

### 4. Not changing

- Header, footer, nav, buttons — already consistent.
- Copy and content order.
- The insurance logo marquee, stats band, home hero mock, or Why section — all recently approved.
- Any JS (intake form, nav, motion, stats).

## Deliverable

After the pass, every page will read like a chapter of the same book: same hero silhouette, same accent color usage, same card shape, same section spacing. I'll take before/after screenshots of the 6 most-visible pages (About, Services, Medication, Conditions, Insurance, FAQ, Contact) and share them so you can confirm before I move on to the legal/utility pages.
