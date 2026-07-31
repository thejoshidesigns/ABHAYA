# Accessibility audit

Generated: 2026-07-31T22:09:34.604Z
Pages: 15 | Viewports: desktop, mobile
Ruleset: wcag2a, wcag2aa, wcag21a, wcag21aa

## 1. Axe findings by severity

| Severity | Findings | Gate |
| --- | --- | --- |
| critical | 0 | **fails build** |
| serious | 0 | **fails build** |
| moderate | 0 | reported only |
| minor | 0 | reported only |

### critical (0)

None.

### serious (0)

None.

### moderate (0)

None.

### minor (0)

None.

## 2. Axe incomplete (needs review, not auto-decidable)

Axe reports these when it cannot resolve the situation on its own, most often a colour-contrast check over a semi-transparent or image background. They are NOT passes. Section 3 resolves the contrast ones.

| Rule | Page | Viewports | Nodes | Example target |
| --- | --- | --- | --- | --- |
| `color-contrast` | /index.html | desktop, mobile | 15 | `div[data-target="12"] > .stats-band__num > .stats-band__valu` |
| `color-contrast` | /about.html | desktop, mobile | 20 | `.hero-editorial__eyebrow` |
| `color-contrast` | /services/index.html | desktop, mobile | 14 | `.hero-editorial__eyebrow` |
| `color-contrast` | /services/medication.html | desktop, mobile | 12 | `.hero-editorial__eyebrow` |
| `color-contrast` | /services/psychotherapy.html | desktop, mobile | 12 | `.hero-editorial__eyebrow` |
| `color-contrast` | /services/telepsychiatry.html | desktop, mobile | 14 | `.hero-editorial__eyebrow` |
| `color-contrast` | /conditions.html | desktop, mobile | 14 | `.hero-editorial__eyebrow` |
| `color-contrast` | /insurance.html | desktop, mobile | 12 | `.hero-editorial__eyebrow` |
| `color-contrast` | /contact.html | desktop, mobile | 16 | `.hero-editorial__eyebrow` |
| `color-contrast` | /intake.html | desktop, mobile | 25 | `.nav__link[data-nav="home"][href="index.html"]` |
| `link-in-text-block` | /intake.html | desktop, mobile | 1 | `.hero-editorial__sub > a[href$="tel:988"]` |
| `color-contrast` | /faq.html | desktop, mobile | 12 | `.hero-editorial__eyebrow` |
| `color-contrast` | /care.html | desktop, mobile | 9 | `.hero-editorial__eyebrow` |
| `color-contrast` | /privacy.html | desktop, mobile | 12 | `.hero-editorial__eyebrow` |
| `color-contrast` | /accessibility.html | desktop, mobile | 12 | `.hero-editorial__eyebrow` |
| `color-contrast` | /404.html | desktop, mobile | 5 | `.crisis-editorial__num` |

## 3. Computed contrast sweep

Independent of axe. Alpha-composites every background layer to get the real effective colour, then applies the WCAG 2.1 threshold (4.5:1, or 3:1 for large text). Elements over gradients or background images are skipped as genuinely undecidable.

No failures. Every resolvable text/background pair meets WCAG AA.

