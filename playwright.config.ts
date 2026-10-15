import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const port = process.env['SITE_TEST_PORT'] || '4321';
const executablePath =
  process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] ||
  (!process.env['CI'] && existsSync('/usr/bin/chromium')
    ? '/usr/bin/chromium'
    : undefined);
export default defineConfig({
  testDir: './tests',
  testMatch: process.env['ADS_TEST_MODE']
    ? 'ads.spec.ts'
    : ['site.spec.ts', 'quality.spec.ts'],
  fullyParallel: true,
  workers: 2,
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ['--no-sandbox'],
    },
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 360, height: 800 },
        defaultBrowserType: 'chromium',
      },
    },
  ],
  webServer: {
    command: 'node scripts/serve-test.mjs',
    port: Number(port),
    reuseExistingServer: false,
  },
});
