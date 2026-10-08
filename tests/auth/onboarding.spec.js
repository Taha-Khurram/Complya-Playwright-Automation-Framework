import { test, expect } from '../../fixtures'
import { workspace } from '../../test-data/testData'

test.describe('Onboarding', () => {

  // Every test needs a brand new, verified account, which means waiting for a real email
  test.describe.configure({ timeout: 180_000 })

  test.beforeEach(async ({ verifiedOwner, emailVerificationPage, loginPage, page }) => {
    await emailVerificationPage.goToLogin()
    await loginPage.signIn(verifiedOwner.email, verifiedOwner.password)
    await expect(page).toHaveURL('/app/onboarding')
  })


  test('Positive: new owner completes all 4 steps and lands on their dashboard', async ({
    verifiedOwner, onboardingPage, dashboardPage,
  }) => {
    const fullName = `${verifiedOwner.firstName} ${verifiedOwner.lastName}`

    await test.step('1/4 Profile', async () => {
      await onboardingPage.completeProfile(verifiedOwner)
    })

    await test.step('2/4 Company', async () => {
      await onboardingPage.createCompany(workspace.companyName)
    })

    await test.step('3/4 Workspace details', async () => {
      await onboardingPage.setUpWorkspace(workspace)
    })

    await test.step('4/4 Skip team invites', async () => {
      await onboardingPage.skipTeamInvites()
    })

    await test.step('Dashboard greets the new owner', async () => {
      await dashboardPage.expectWelcome(fullName)
      await dashboardPage.closeTour()
      await dashboardPage.expectSignedInAs(fullName, verifiedOwner.email)
    })
  })


  test('Negative: workspace details with an invalid NPI cannot be saved', async ({ verifiedOwner, onboardingPage }) => {

    await onboardingPage.completeProfile(verifiedOwner)
    await onboardingPage.createCompany(workspace.companyName)

    await onboardingPage.fillWorkspaceDetails({ ...workspace, npi: workspace.invalidNpi })

    await expect(onboardingPage.invalidNpiError).toBeVisible()
    await expect(onboardingPage.workspaceToast).toBeHidden()
    await onboardingPage.expectStep(3, onboardingPage.workspaceHeading)
  })
})
