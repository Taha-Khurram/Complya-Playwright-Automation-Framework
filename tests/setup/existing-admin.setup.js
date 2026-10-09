import { test as setup, expect } from '../../fixtures'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { EXISTING_ADMIN_PROFILE, EXISTING_ADMIN_STATE } from '../../utils/auth'

// Signs in with the existing account from ADMIN_EMAIL / ADMIN_PASSWORD (no sign up), for the
// tests in tests/existing-account
setup('Sign in as the existing admin', async ({ page, loginPage, dashboardPage }) => {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  expect(email, 'Set ADMIN_EMAIL in .env, or as a GitHub secret on CI').toBeTruthy()
  expect(password, 'Set ADMIN_PASSWORD in .env, or as a GitHub secret on CI').toBeTruthy()

  await loginPage.login(email, password)

  // The admin is the staff member on the sessions, so record their name from the greeting,
  // e.g. "Good Afternoon, Muhammad Taha"
  const fullName = (await dashboardPage.greeting.innerText()).replace(/^Good \w+,/, '').trim()
  expect(fullName, 'Admin name should be read from the dashboard greeting').toBeTruthy()

  mkdirSync(dirname(EXISTING_ADMIN_STATE), { recursive: true })
  writeFileSync(EXISTING_ADMIN_PROFILE, JSON.stringify({ email, fullName }, null, 2))
  // Firebase keeps the signed-in user in IndexedDB, so it must be saved too
  await page.context().storageState({ path: EXISTING_ADMIN_STATE, indexedDB: true })
})
