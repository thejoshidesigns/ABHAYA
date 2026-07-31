const { test, expect } = require('@playwright/test');

const PAGES = [
  '/index.html',
  '/about.html',
  '/services/index.html',
  '/services/medication.html',
  '/services/psychotherapy.html',
  '/services/telepsychiatry.html',
  '/conditions.html',
  '/insurance.html',
  '/contact.html',
  '/intake.html',
  '/faq.html',
  '/care.html',
];

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '390x844', width: 390, height: 844 },
  // Immediately below and above the global grid breakpoint (720px).
  { name: '700x900', width: 700, height: 900 },
  { name: '721x900', width: 721, height: 900 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
];


for (const vp of VIEWPORTS) {
  for (const url of PAGES) {
    test(`no horizontal overflow: ${url} @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(url, { waitUntil: 'load' });

      const overflow = await page.evaluate((viewportWidth) => {
        const offenders = [];
        document.querySelectorAll('body *').forEach((el) => {
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          if (rect.right > viewportWidth + 1) {
            offenders.push(
              `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} right=${Math.round(rect.right)}`
            );
          }
        });
        return {
          scrollWidth: document.documentElement.scrollWidth,
          offenders: offenders.slice(0, 8),
        };
      }, vp.width);

      expect(
        overflow.scrollWidth,
        `${url} overflows horizontally at ${vp.name}: ${overflow.offenders.join(', ')}`
      ).toBeLessThanOrEqual(vp.width + 1);
    });
  }
}

test.describe('motion preferences', () => {
  test.use({ reducedMotion: 'reduce' });

  test('home page renders content with reduced motion', async ({ page }) => {
    await page.goto('/index.html');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const opacity = await h1.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0.9);
  });
});

test.describe('zoom resilience', () => {
  test('content stays readable at 200% zoom', async ({ page }) => {
    // Emulating 200% zoom by halving the CSS viewport at a mobile-first width.
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto('/contact.html');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(641);
  });
});
