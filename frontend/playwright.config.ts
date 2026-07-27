import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  expect: {
    timeout: 15_000,
  },
  forbidOnly: !!process.env.CI,
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      dependencies: ['setup'],
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  retries: process.env.CI ? 2 : 0,
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://localhost:5173',
  },
  workers: 1,
});
