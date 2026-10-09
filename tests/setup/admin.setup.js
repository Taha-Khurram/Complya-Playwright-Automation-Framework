import { test as setup, expect } from '../../fixtures'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { site, workspace } from '../../test-data/testData'
import { ADMIN_PROFILE, ADMIN_STATE } from '../../utils/auth'
import { uniqueName } from '../../utils/unique'

// Every run starts from scratch: a brand new owner signs up, verifies their email, completes
// onboarding and creates a site. All other tests then run as this admin, in this workspace.
setup('Create a new admin account and workspace', async ({
  page, verifiedOwner, emailVerificationPage, loginPage, onboardingPage, dashboardPage, sitesPage,
}) => {
  const fullName = `${verifiedOwner.firstName} ${verifiedOwner.lastName}`
  const siteName = `Playwright Site ${uniqueName()}`

  await setup.step('Sign in for the first time', async () => {
    await emailVerificationPage.goToLogin()
    await loginPage.signIn(verifiedOwner.email, verifiedOwner.password)
    await expect(page).toHaveURL('/app/onboarding')
  })

  await setup.step('Complete onboarding', async () => {
    await onboardingPage.completeProfile(verifiedOwner)
    await onboardingPage.createCompany(workspace.companyName)
    await onboardingPage.setUpWorkspace(workspace)
    await onboardingPage.skipTeamInvites()
    await dashboardPage.expectWelcome(fullName)
    await dashboardPage.closeTour()
  })

  // A new workspace has no sites, and clients and staff must belong to one
  await setup.step('Create a site', async () => {
    await sitesPage.open()
    await sitesPage.createSite({ ...site, name: siteName })
  })

  await setup.step('Save the session and account for the other tests', async () => {
    mkdirSync(dirname(ADMIN_STATE), { recursive: true })
    const profile = { email: verifiedOwner.email, password: verifiedOwner.password, fullName, site: siteName }
    writeFileSync(ADMIN_PROFILE, JSON.stringify(profile, null, 2))
    // Firebase keeps the signed-in user in IndexedDB, so it must be saved too
    await page.context().storageState({ path: ADMIN_STATE, indexedDB: true })
  })
})
