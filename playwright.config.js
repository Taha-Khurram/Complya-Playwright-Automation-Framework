// @ts-check
import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'fs'
import { ADMIN_STATE, EXISTING_ADMIN_STATE } from './utils/auth'

// Load BASE_URL etc. from .env when present (see .env.example)
if (existsSync('.env')) process.loadEnvFile('.env')

// Browser window size for every project
const viewport = { width: 1060, height: 1280 }

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
    baseURL: process.env.BASE_URL || 'https://app.complya.com',
    viewport,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Slow each action down to watch a headed run, e.g. SLOWMO=800
    launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
  },

  projects: [
    // Creates a brand new admin and workspace for this run (sign up, email, onboarding, site).
    // Waits for a real email, so it gets more time than a normal test.
    {
      name: 'setup',
      testMatch: /[\\/]admin\.setup\.js$/,
      timeout: 240_000,
      use: { ...devices['Desktop Chrome'], viewport },
    },
    // Signed-out journeys: sign up, onboarding, login, forgot password.
    // Login and duplicate sign up use the admin created by setup.
    {
      name: 'auth',
      testDir: './tests/auth',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport },
    },
    // Admin journeys start already signed in
    {
      name: 'admin',
      testDir: './tests',
      testIgnore: [/auth\//, /setup\//, /existing-account\//],
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport, storageState: ADMIN_STATE },
    },
    // Signs in with the existing account in ADMIN_EMAIL / ADMIN_PASSWORD (no sign up)
    {
      name: 'existing-admin-setup',
      testMatch: /existing-admin\.setup\.js$/,
      use: { ...devices['Desktop Chrome'], viewport },
    },
    // Journeys that must run on the existing account, e.g. a full session with a signed note
    {
      name: 'existing-admin',
      testDir: './tests/existing-account',
      dependencies: ['existing-admin-setup'],
      use: { ...devices['Desktop Chrome'], viewport, storageState: EXISTING_ADMIN_STATE },
    },
  ],
})
