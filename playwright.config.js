import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium', channel: 'chrome', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  reporter: 'list',
  webServer: { command: 'npm run dev:local', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI, timeout: 180000 },
});
