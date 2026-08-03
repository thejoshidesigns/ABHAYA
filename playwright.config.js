const { defineConfig, devices } = require('@playwright/test');

const PORT = 4321;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list']] : [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    screenshot: 'only-on-failure',
  },
  // Chromium is the default local gate. Firefox and WebKit are opt-in via
  // `npm run test:cross-browser`, which passes --project explicitly. Playwright
  // WebKit is the WebKit engine used by Safari; it is NOT Safari itself and is
  // NOT iOS. Treat it as engine coverage, not as a substitute for device QA.
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        // Environments that supply their own Chromium (CI images, sandboxes)
        // can point at it with CHROME_PATH. Unset, Playwright uses its own.
        launchOptions: process.env.CHROME_PATH
          ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] }
          : {},
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], headless: true },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], headless: true },
    },
  ],

  webServer: {
    command: `node scripts/serve-dist.js ${PORT}`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
