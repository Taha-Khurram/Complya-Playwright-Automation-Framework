import { test, expect } from '../fixtures'
import { newOwner, workspace } from '../test-data/testData'
import { createInbox, waitForEmail } from '../utils/mailbox'
import { EmailPage } from '../pages/EmailPage'

test.describe("New user sign up", () => {

  test("New user can sign up, verify their email and complete onboarding", async ({
    page, request, signUpPage, emailVerificationPage, loginPage, onboardingPage, dashboardPage,
  }) => {

    // Includes waiting for a real email, so allow more than the default 30s
    test.setTimeout(180_000)

    const inbox = await createInbox(request, 'owner')
    const owner = { ...newOwner, email: inbox.address }
    const fullName = `${owner.firstName} ${owner.lastName}`


    await test.step("Sign up with a new email", async () => {
      await signUpPage.open()
      await signUpPage.signUp(owner.email, owner.password)
      await emailVerificationPage.expectVerificationEmailSent(owner.email)
    })

    await test.step("Verify the email from the inbox", async () => {
      const verificationEmail = await waitForEmail(request, inbox, /verify your email/i)
      expect(verificationEmail.subject).toBe('Verify your email for complya.com')

      // Open the email in the same tab, like a user clicking it in their inbox
      const emailPage = new EmailPage(page)
      await emailPage.open(verificationEmail.html)
      await emailPage.verifyEmail()
      await emailVerificationPage.expectEmailVerified()
    })

    await test.step("Sign in for the first time and land on onboarding", async () => {
      await emailVerificationPage.goToLogin()
      await loginPage.signIn(owner.email, owner.password)
      await loginPage.expectSignInSuccess()
      await expect(page).toHaveURL('/app/onboarding')
    })

    await test.step("Onboarding 1/4 - profile", async () => {
      await onboardingPage.completeProfile(owner)
    })

    await test.step("Onboarding 2/4 - company", async () => {
      await onboardingPage.createCompany(workspace.companyName)
    })

    await test.step("Onboarding 3/4 - workspace details", async () => {
      await onboardingPage.setUpWorkspace(workspace)
    })

    await test.step("Onboarding 4/4 - skip team invites", async () => {
      await onboardingPage.skipTeamInvites()
    })

    await test.step("Redirected to the dashboard as the new owner", async () => {
      await dashboardPage.expectWelcome(fullName)
      await dashboardPage.closeTour()
      await dashboardPage.expectSignedInAs(fullName, owner.email)
    })
  })


  test("Create Account is only enabled once the password meets the rules", async ({ signUpPage }) => {

    await signUpPage.open()

    await test.step("Weak password keeps the button disabled", async () => {
      await signUpPage.fillForm('someone@example.com', 'short')
      await expect(signUpPage.specialCharHint).toBeVisible()
      await expect(signUpPage.minLengthHint).toBeVisible()
      await expect(signUpPage.createAccountButton).toBeDisabled()
    })

    await test.step("Mismatched passwords are rejected", async () => {
      await signUpPage.fillForm('someone@example.com', newOwner.password, 'Different@1234')
      await expect(signUpPage.specialCharMet).toBeVisible()
      await expect(signUpPage.minLengthMet).toBeVisible()
      await signUpPage.createAccountButton.click()
      await expect(signUpPage.passwordsMismatchError).toBeVisible()
      await expect(signUpPage.page).toHaveURL('/app/signup')
    })

    await test.step("Matching strong password enables the button", async () => {
      await signUpPage.confirmPasswordInput.fill(newOwner.password)
      await expect(signUpPage.createAccountButton).toBeEnabled()
    })
  })
})
