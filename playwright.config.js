// @ts-check
import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'fs'
import { ADMIN_STATE } from './utils/auth'

// Load ADMIN_EMAIL / ADMIN_PASSWORD etc. from .env when present (see .env.example)
if (existsSync('.env')) process.loadEnvFile('.env')

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Every test writes to production, so keep the load on it modest
  workers: process.env.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // On CI, 'github' adds failure annotations to the workflow run
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL || 'https://complya.com',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Slow each action down to watch a headed run, e.g. SLOWMO=800
    launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
  },

  projects: [
    // Signs the admin in once and saves the session for the admin projects
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    // Signed-out journeys: sign up, onboarding, login, forgot password
    {
      name: 'auth',
      testDir: './tests/auth',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    // Admin journeys start already signed in
    {
      name: 'admin',
      testDir: './tests',
      testIgnore: [/auth\//, /setup\//],
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: ADMIN_STATE },
    },
  ],
})
