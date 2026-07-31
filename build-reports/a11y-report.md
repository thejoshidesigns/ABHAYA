# Accessibility audit

Generated: 2026-07-31T21:59:48.171Z
Pages: 15 | Viewports: desktop, mobile
Ruleset: wcag2a, wcag2aa, wcag21a, wcag21aa

## 1. Axe findings by severity

| Severity | Findings | Gate |
| --- | --- | --- |
| critical | 0 | **fails build** |
| serious | 20 | **fails build** |
| moderate | 0 | reported only |
| minor | 0 | reported only |

### critical (0)

None.

### serious (20)

| Rule | Page | Viewports | Nodes | Example target |
| --- | --- | --- | --- | --- |
| `color-contrast` | /index.html | desktop, mobile | 24 | `.why-item:nth-child(1) > .why-item__body > p` |
| `color-contrast` | /services/index.html | desktop, mobile | 10 | `.eyebrow--gold` |
| `color-contrast` | /services/medication.html | desktop, mobile | 8 | `.is-active > .timeline__node` |
| `color-contrast` | /services/psychotherapy.html | desktop, mobile | 7 | `.is-active > .timeline__node` |
| `color-contrast` | /services/telepsychiatry.html | desktop, mobile | 1 | `.bento__tile--sage > .bento__body` |
| `color-contrast` | /conditions.html | desktop, mobile | 19 | `#adhd > .bento__cta[href="services/index.html"]` |
| `color-contrast` | /insurance.html | desktop, mobile | 4 | `.rate-card:nth-child(1) > .rate-card__unit` |
| `color-contrast` | /contact.html | desktop, mobile | 4 | `.bento__tile--sage > .bento__body` |
| `color-contrast` | /care.html | desktop, mobile | 10 | `.care-principle:nth-child(1) > .care-principle__num[aria-hid` |
| `color-contrast` | /privacy.html | desktop, mobile | 1 | `.callout__body` |

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
| `color-contrast` | /insurance.html | desktop, mobile | 16 | `.hero-editorial__eyebrow` |
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

| Selector | Text | Fg | Bg | Ratio | Needs | Pages |
| --- | --- | --- | --- | --- | --- | --- |
| `span.eyebrow.eyebrow--gold` | Our services | `#c9a24e` | `#f4f9fb` | **2.26:1** | 4.5:1 | /services/index.html |
| `a.bento__cta` | See treatment options | `#069ab9` | `#c2dfe5` | **2.37:1** | 4.5:1 | /conditions.html |
| `span.bento__cta` | Replies within 1–2 business days | `#069ab9` | `#c2dfe5` | **2.37:1** | 4.5:1 | /contact.html |
| `span.eyebrow.eyebrow--accent` | Coming soon | `#07abce` | `#ebf5f9` | **2.45:1** | 4.5:1 | /services/index.html |
| `span.care-principle__num` | 01 | `#07abce` | `#f3f8db` | **2.49:1** | 4.5:1 | /index.html, /care.html |
| `em` | your | `#07abce` | `#f4f9fb` | **2.56:1** | 3:1 | /index.html |
| `span.accent` | conversation | `#07abce` | `#f4f9fb` | **2.56:1** | 3:1 | /index.html, /care.html |
| `span.intake__step-bubble` | 1 | `#f4f9fb` | `#07abce` | **2.56:1** | 4.5:1 | /intake.html |
| `span.soft-card__cta` | Learn more → | `#07abce` | `#ffffff` | **2.72:1** | 4.5:1 | /index.html |
| `a.cta-close__btn` | Request initial consultation | `#ffffff` | `#07abce` | **2.72:1** | 4.5:1 | /index.html, /care.html |
| `span.bento-ed__eyebrow` | In-person & Telehealth | `#07abce` | `#ffffff` | **2.72:1** | 4.5:1 | /services/index.html |
| `span.bento-ed__rule-label` | Clinical assessment | `#07abce` | `#ffffff` | **2.72:1** | 4.5:1 | /services/index.html |
| `span.timeline__node` | 01 | `#ffffff` | `#07abce` | **2.72:1** | 4.5:1 | /services/index.html, /services/medication.html, /services/psychotherapy.html, /conditions.html |
| `div.step__num` | 1 | `#ffffff` | `#07abce` | **2.72:1** | 4.5:1 | /insurance.html |
| `span.eyebrow.eyebrow--terracotta` | We help with | `#069ab9` | `#f4f9fb` | **3.13:1** | 4.5:1 | /index.html |
| `span.req` | * | `#069ab9` | `#f4f9fb` | **3.13:1** | 4.5:1 | /contact.html |
| `a.bento__cta` | See treatment options | `#069ab9` | `#ffffff` | **3.32:1** | 4.5:1 | /conditions.html |
| `span.bento__cta` | After hours: 988 for crisis, 911 for emergenc | `#069ab9` | `#ffffff` | **3.32:1** | 4.5:1 | /contact.html |
| `span.req` | * | `#069ab9` | `#ffffff` | **3.32:1** | 4.5:1 | /intake.html |
| `p.bento__body` | Please request refills before you run out. Yo | `#4e6370` | `#c2dfe5` | **4.48:1** | 4.5:1 | /services/medication.html, /services/psychotherapy.html, /services/telepsychiatry.html, /conditions.html, /contact.html |
| `strong` | at least 48 hours | `#4e6370` | `#c2dfe5` | **4.48:1** | 4.5:1 | /services/medication.html |
| `a` | contactus@abhayabh.com | `#4e6370` | `#c2dfe5` | **4.48:1** | 4.5:1 | /contact.html |
| `p.callout__body` | Contact the Privacy Officer using the informa | `#4e6370` | `#c2dfe5` | **4.48:1** | 4.5:1 | /privacy.html |

