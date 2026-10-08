import { test as setup, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { LoginPage } from '../../pages/LoginPage'
import { DashboardPage } from '../../pages/DashboardPage'
import { admin } from '../../test-data/testData'
import { ADMIN_PROFILE, ADMIN_STATE } from '../../utils/auth'

// Signs the admin in once per run; the admin project reuses this session instead of signing in per test
setup('Sign in as admin', async ({ page }) => {

  expect(admin.email, 'Set ADMIN_EMAIL in .env (see .env.example)').toBeTruthy()
  expect(admin.password, 'Set ADMIN_PASSWORD in .env (see .env.example)').toBeTruthy()

  await new LoginPage(page).login(admin.email, admin.password)

  // The admin is also the staff member sessions are scheduled for, so record their name.
  // The profile button reads "Profile <full name> <email>".
  const dashboardPage = new DashboardPage(page)
  await dashboardPage.sidebar.expand()
  const fullName = (await dashboardPage.profileButton.locator('strong').innerText()).trim()

  mkdirSync(dirname(ADMIN_STATE), { recursive: true })
  writeFileSync(ADMIN_PROFILE, JSON.stringify({ email: admin.email, fullName }, null, 2))

  // Firebase keeps the signed-in user in IndexedDB, so it must be saved too
  await page.context().storageState({ path: ADMIN_STATE, indexedDB: true })
})
