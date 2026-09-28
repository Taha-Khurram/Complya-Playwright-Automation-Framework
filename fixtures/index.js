import { test as base, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { SitesPage } from '../pages/SitesPage'
import { ClientsPage } from '../pages/ClientsPage'
import { StaffManagementPage } from '../pages/StaffManagementPage'
import { SignUpPage } from '../pages/SignUpPage'
import { EmailVerificationPage } from '../pages/EmailVerificationPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { createInbox } from '../utils/mailbox'

// Tests import `test` from here instead of '@playwright/test' to get page objects ready-made
export const test = base.extend({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },

  sitesPage: async ({ page }, use) => {
    await use(new SitesPage(page))
  },

  clientsPage: async ({ page }, use) => {
    await use(new ClientsPage(page))
  },

  staffManagementPage: async ({ page }, use) => {
    await use(new StaffManagementPage(page))
  },

  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page))
  },

  emailVerificationPage: async ({ page }, use) => {
    await use(new EmailVerificationPage(page))
  },

  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page))
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page))
  },

  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page))
  },

  resetPasswordPage: async ({ page }, use) => {
    await use(new ResetPasswordPage(page))
  },

  // A fresh real inbox for tests that need to receive email
  inbox: async ({ request }, use) => {
    await use(await createInbox(request))
  },

  // Second "user" with no admin cookies. Manually created contexts don't inherit
  // the config's video setting, so record it here too.
  staffContext: async ({ browser, baseURL }, use, testInfo) => {
    const context = await browser.newContext({
      baseURL,
      recordVideo: { dir: testInfo.outputPath('staff-video') },
    })
    await use(context)
    await context.close()
  },
})

export { expect }
