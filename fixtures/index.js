import { test as base, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { LoginPage } from '../pages/LoginPage'
import { SignUpPage } from '../pages/SignUpPage'
import { EmailPage } from '../pages/EmailPage'
import { EmailVerificationPage } from '../pages/EmailVerificationPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { SitesPage } from '../pages/SitesPage'
import { ClientsPage } from '../pages/ClientsPage'
import { ClientProfilePage } from '../pages/ClientProfilePage'
import { StaffManagementPage } from '../pages/StaffManagementPage'
import { SchedulePage } from '../pages/SchedulePage'
import { SessionFormPage } from '../pages/SessionFormPage'
import { SessionDetailPage } from '../pages/SessionDetailPage'
import { GoalFormPage } from '../pages/GoalFormPage'
import { GoalAttemptPage } from '../pages/GoalAttemptPage'
import { createInbox, waitForEmail } from '../utils/mailbox'
import { ADMIN_PROFILE, ADMIN_STATE } from '../utils/auth'
import { daysFromToday } from '../utils/dates'
import { uniqueName } from '../utils/unique'
import { client, goal as goalDefaults, newOwner, session as sessionDefaults } from '../test-data/testData'

// Tests import `test` and `expect` from here instead of '@playwright/test'
export const test = base.extend({

  // ---- Page objects ----
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  signUpPage: async ({ page }, use) => use(new SignUpPage(page)),
  emailVerificationPage: async ({ page }, use) => use(new EmailVerificationPage(page)),
  onboardingPage: async ({ page }, use) => use(new OnboardingPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  resetPasswordPage: async ({ page }, use) => use(new ResetPasswordPage(page)),
  sitesPage: async ({ page }, use) => use(new SitesPage(page)),
  clientsPage: async ({ page }, use) => use(new ClientsPage(page)),
  clientProfilePage: async ({ page }, use) => use(new ClientProfilePage(page)),
  staffManagementPage: async ({ page }, use) => use(new StaffManagementPage(page)),
  schedulePage: async ({ page }, use) => use(new SchedulePage(page)),
  sessionFormPage: async ({ page }, use) => use(new SessionFormPage(page)),
  sessionDetailPage: async ({ page }, use) => use(new SessionDetailPage(page)),
  goalFormPage: async ({ page }, use) => use(new GoalFormPage(page)),
  goalAttemptPage: async ({ page }, use) => use(new GoalAttemptPage(page)),

  // ---- Test data ----

  // The admin created for this run, { email, password, fullName, site }, saved by tests/setup/admin.setup.js
  adminUser: [async ({}, use) => {
    await use(JSON.parse(readFileSync(ADMIN_PROFILE, 'utf8')))
  }, { scope: 'worker' }],

  // A client created once per worker, so session and goal tests can find their own data
  // among everything else on production. { firstName, lastName, fullName, id }
  testClient: [async ({ browser, adminUser }, use, workerInfo) => {
    const { baseURL, viewport } = workerInfo.project.use
    const context = await browser.newContext({ baseURL, viewport, storageState: ADMIN_STATE })
    const page = await context.newPage()
    const clientsPage = new ClientsPage(page)
    const newClient = { ...client, lastName: uniqueName(), site: adminUser.site }
    newClient.fullName = `${newClient.firstName} ${newClient.lastName}`

    await clientsPage.visit()
    newClient.id = await clientsPage.createClient(newClient)
    // Proves the id belongs to this client before every session and goal test relies on it
    await new ClientProfilePage(page).expectClient(newClient.id, newClient)
    await context.close()

    await use(newClient)
  }, { scope: 'worker', timeout: 90_000 }],

  // Schedules a session for testClient from the Schedule page and returns each occurrence
  // with its id. daysAhead picks the date; repeatDays > 0 adds that many daily repeats.
  // Each test uses its own daysAhead so its sessions never clash with another test's.
  createSession: async ({ adminUser, testClient, schedulePage, sessionFormPage, clientProfilePage }, use) => {
    await use(async ({ daysAhead, repeatDays = 0, ...overrides }) => {
      const details = { ...sessionDefaults, staff: adminUser.fullName, client: testClient, ...overrides }

      await schedulePage.visit()
      await schedulePage.addSession()
      await sessionFormPage.fill({ ...details, date: daysFromToday(daysAhead) })
      if (repeatDays) await sessionFormPage.repeatDailyUntil(daysFromToday(daysAhead + repeatDays + 1))
      await sessionFormPage.create()

      const occurrences = []
      for (let day = 0; day <= repeatDays; day++) {
        const occurrence = { ...details, date: daysFromToday(daysAhead + day) }
        await clientProfilePage.openSessions(testClient.id)
        occurrence.id = await clientProfilePage.openSession(occurrence)
        occurrences.push(occurrence)
      }
      return occurrences
    })
  },

  // Publishes a uniquely named goal for testClient and returns it
  createGoal: async ({ testClient, clientProfilePage, goalFormPage }, use) => {
    await use(async (overrides = {}) => {
      const newGoal = { ...goalDefaults, name: `${goalDefaults.name} ${uniqueName()}`, ...overrides }
      await clientProfilePage.openPrograms(testClient.id)
      await clientProfilePage.addNewGoal()
      await goalFormPage.createGoal(newGoal)
      return newGoal
    })
  },

  // A fresh real inbox for tests that need to receive email
  inbox: async ({ request }, use) => {
    await use(await createInbox(request))
  },

  // A brand new owner account that has signed up and verified its email, but not signed in yet
  verifiedOwner: async ({ page, request, signUpPage, emailVerificationPage }, use) => {
    const inbox = await createInbox(request, 'owner')
    const owner = { ...newOwner, email: inbox.address }

    await signUpPage.open()
    await signUpPage.signUp(owner.email, owner.password)
    await emailVerificationPage.expectVerificationEmailSent(owner.email)

    const verificationEmail = await waitForEmail(request, inbox, /verify your email/i)
    const emailPage = new EmailPage(page)
    await emailPage.open(verificationEmail.html)
    await emailPage.verifyEmail()
    await emailVerificationPage.expectEmailVerified()

    await use(owner)
  },

  // Second "user" with no admin session, e.g. an invited staff member
  staffContext: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL })
    await use(context)
    await context.close()
  },
})

export { expect }
