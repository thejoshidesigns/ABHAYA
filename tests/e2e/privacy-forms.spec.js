const { test, expect } = require('@playwright/test');

/* =========================================================================
   Privacy and form-safety guarantees.

   These are behavioural promises made to visitors, so they are asserted, not
   assumed:
     1. Reading the contact page sends nothing to Google.
     2. The map only loads after an explicit click, and then it works.
     3. Neither form posts anywhere while the Web3Forms access key is blank.
     4. Neither form ever shows a success message it cannot back up.
   ========================================================================= */

// Any Google-owned origin the Maps embed could legitimately reach.
const GOOGLE_ORIGINS = /(^|\.)(google\.com|googleapis\.com|gstatic\.com|googleusercontent\.com)$/i;

function watchRequests(page) {
  const google = [];
  const thirdParty = [];
  page.on('request', (req) => {
    let host;
    try {
      host = new URL(req.url()).hostname;
    } catch {
      return;
    }
    if (host === '127.0.0.1' || host === 'localhost') return;
    if (GOOGLE_ORIGINS.test(host)) google.push(req.url());
    else thirdParty.push(`${req.resourceType()} ${req.url()}`);
  });
  return { google, thirdParty };
}

test.describe('click-to-load map consent', () => {
  test('no Google request before consent, embed loads after', async ({ page }) => {
    const seen = watchRequests(page);

    await page.goto('/contact.html', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    expect(
      seen.google,
      `Google was contacted before consent:\n${seen.google.join('\n')}`
    ).toEqual([]);
    expect(
      seen.thirdParty,
      `Unexpected third-party requests before consent:\n${seen.thirdParty.join('\n')}`
    ).toEqual([]);

    const button = page.locator('[data-map-load]');
    await expect(button).toBeVisible();

    const beforeThirdParty = seen.thirdParty.length;
    await button.click();

    // At least one Google request must follow; the embed pulls several.
    await expect.poll(() => seen.google.length, { timeout: 20_000 }).toBeGreaterThan(0);

    const frame = page.locator('[data-map-frame] iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toBeVisible();
    // The iframe actually committed a document rather than erroring out.
    await expect
      .poll(async () => (await frame.elementHandle())?.contentFrame().then((f) => !!f), {
        timeout: 20_000,
      })
      .toBeTruthy();

    const newThirdParty = seen.thirdParty.slice(beforeThirdParty);
    expect(
      newThirdParty,
      `Consent introduced non-Google third-party requests:\n${newThirdParty.join('\n')}`
    ).toEqual([]);
  });
});

test.describe('forms stay inactive while unconfigured', () => {
  for (const [label, url] of [
    ['contact', '/contact.html'],
    ['appointment request', '/intake.html'],
  ]) {
    test(`${label} form never posts or fakes success without an access key`, async ({ page }) => {
      const posts = [];
      page.on('request', (req) => {
        if (req.method() === 'POST') posts.push(req.url());
      });

      await page.goto(url, { waitUntil: 'load' });

      const key = await page
        .locator('input[name="access_key"]')
        .first()
        .getAttribute('value')
        .catch(() => null);
      // This suite documents the unconfigured state. If a key is ever added,
      // the delivery path must be tested for real instead.
      test.skip(!!key, 'an access key is configured; test real delivery separately');

      const form = page.locator('form').first();
      // Fill every visible required control so validation cannot mask the
      // check. The intake form is a multi-step wizard, so repeat per panel and
      // advance until the real submit button is reachable.
      const fillVisibleRequired = async () => {
        for (const field of await form
          .locator('input[required], textarea[required], select[required]')
          .all()) {
          if (!(await field.isVisible())) continue;
          const tag = await field.evaluate((el) => el.tagName.toLowerCase());
          const type = (await field.getAttribute('type')) || 'text';
          if (tag === 'select') {
            const values = await field.locator('option').evaluateAll((os) =>
              os.map((o) => o.value).filter(Boolean)
            );
            if (values.length) await field.selectOption(values[0]);
          } else if (type === 'checkbox' || type === 'radio') {
            await field.check();
          } else if (type === 'email') {
            await field.fill('qa.example@example.org');
          } else if (type === 'tel') {
            await field.fill('5735550100');
          } else if (type === 'date') {
            await field.fill('2030-01-15');
          } else {
            await field.fill('Automated QA check, please ignore.');
          }
        }
      };

      const submit = form.locator('button[type="submit"], input[type="submit"]').first();
      const next = form.locator('[data-intake-next], button:has-text("Continue"), button:has-text("Next")');

      for (let step = 0; step < 8; step += 1) {
        await fillVisibleRequired();
        if (await submit.isVisible()) break;
        const nextVisible = next.filter({ visible: true }).first();
        if (!(await nextVisible.count())) break;
        await nextVisible.click();
        await page.waitForTimeout(300);
      }

      await expect(submit).toBeVisible();
      await submit.click();
      await page.waitForTimeout(1500);


      expect(posts, `The form posted while unconfigured:\n${posts.join('\n')}`).toEqual([]);

      const body = (await page.locator('body').innerText()).toLowerCase();
      const falseSuccess = [
        'message sent',
        'thanks for reaching out',
        'we have received your',
        'submitted successfully',
        'request received',
      ].filter((phrase) => body.includes(phrase));
      expect(
        falseSuccess,
        `The page claims delivery that did not happen: ${falseSuccess.join(', ')}`
      ).toEqual([]);
    });
  }
});
