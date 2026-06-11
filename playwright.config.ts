import { defineConfig, devices } from '@playwright/test'

const PORT = 3105

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    // iPhone viewport on the Chromium engine — Playwright's WebKit build
    // isn't downloadable in the CI/sandbox network policy
    { name: 'mobile', use: { ...devices['iPhone 14'], browserName: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      POSTGRES_URL: process.env.POSTGRES_URL ?? 'postgresql://e2e:e2e@localhost:5432/e2e',
      NEXTAUTH_SECRET: 'e2e-secret',
      NEXTAUTH_URL: `http://localhost:${PORT}`,
    },
  },
})
