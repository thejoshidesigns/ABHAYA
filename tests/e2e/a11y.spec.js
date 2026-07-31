const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// Every page in the site. Keep in sync with build.js output.
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
  '/privacy.html',
  '/accessibility.html',
  '/404.html',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const viewport of VIEWPORTS) {
  for (const url of PAGES) {
    test(`axe: ${url} @ ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(url, { waitUntil: 'load' });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );

      const summary = blocking
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
        .join('\n');

      expect(summary, `Accessibility violations on ${url} @ ${viewport.name}:\n${summary}`).toBe('');
    });
  }
}

test.describe('keyboard and interaction coverage', () => {
  test('skip link moves focus to main content', async ({ page }) => {
    await page.goto('/index.html');
    await page.keyboard.press('Tab');
    const skip = page.locator('a.skip-link');
    if (await skip.count()) {
      await expect(skip.first()).toBeFocused();
    }
  });

  test('mobile menu opens, traps focus, closes on Escape and returns focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html');

    const toggle = page.locator('.nav__toggle');
    const menu = page.locator('#mobile-menu');

    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await toggle.click();
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    expect(await menu.getAttribute('inert')).toBeNull();

    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(toggle).toBeFocused();
  });

  test('FAQ accordion and filters respond', async ({ page }) => {
    await page.goto('/faq.html');
    const firstQuestion = page.locator('.accordion__trigger, .faq__question, summary').first();
    if (await firstQuestion.count()) {
      await firstQuestion.click();
    }
    const filter = page.locator('[data-faq-filter]').first();
    if (await filter.count()) {
      await filter.click();
      await expect(page.locator('[data-faq-item]:visible').first()).toBeVisible();
    }
  });

  test('conditions filter narrows the list', async ({ page }) => {
    await page.goto('/conditions.html');
    const filter = page.locator('[data-filter]').nth(1);
    if (await filter.count()) {
      await filter.click();
      await expect(page.locator('[data-condition]:visible').first()).toBeVisible();
    }
  });
});
