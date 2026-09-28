import { test, expect } from '../fixtures'
import { passwordResetUser } from '../test-data/testData'
import { createInbox, waitForEmail } from '../utils/mailbox'
import { EmailPage } from '../pages/EmailPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'

test.describe("Forgot password", () => {

  test("User can reset their password from the emailed link", async ({
    page, browser, baseURL, request, signUpPage, loginPage, forgotPasswordPage, resetPasswordPage,
  }) => {

    // Includes waiting for real emails, so allow more than the default 30s
    test.setTimeout(180_000)

    const inbox = await createInbox(request, 'reset')
    const email = inbox.address
    const { oldPassword, newPassword, weakPassword } = passwordResetUser
    let resetEmail


    await test.step("Create an account whose inbox we can read", async () => {
      await signUpPage.open()
      await signUpPage.signUp(email, oldPassword)
    })

    await test.step("Request a reset link from the login page", async () => {
      await loginPage.open()
      await loginPage.goToForgotPassword()
      await forgotPasswordPage.requestResetLink(email)
      await forgotPasswordPage.expectResetLinkSent()
    })

    await test.step("Receive the reset email for this account", async () => {
      resetEmail = await waitForEmail(request, inbox, /reset your password/i)
      expect(resetEmail.subject).toBe('Reset your password for complya.com')
      expect(resetEmail.html).toContain(email)
    })

    await test.step("Open the reset link", async () => {
      const emailPage = new EmailPage(page)
      await emailPage.open(resetEmail.html)
      await emailPage.openResetPasswordLink()
      await resetPasswordPage.expectOpenFor(email)
    })

    await test.step("Weak and mismatched passwords are rejected", async () => {
      await resetPasswordPage.submit(weakPassword)
      await resetPasswordPage.expectRejectedWith(resetPasswordPage.weakPasswordToast)

      await resetPasswordPage.submit(newPassword, 'Different@1234')
      await resetPasswordPage.expectRejectedWith(resetPasswordPage.mismatchToast)
    })

    await test.step("Set a new password", async () => {
      await resetPasswordPage.resetPassword(newPassword)
    })

    await test.step("Old password no longer works", async () => {
      await loginPage.signIn(email, oldPassword)
      await loginPage.expectInvalidCredentials()
    })

    await test.step("New password signs in", async () => {
      await loginPage.signIn(email, newPassword)
      await loginPage.expectSignInSuccess()
      // This account never finished onboarding, so that's where it lands
      await expect(page).toHaveURL('/app/onboarding')
    })

    await test.step("The same reset link can't be used twice", async () => {
      // A clean browser session, like opening the email again on another device
      const context = await browser.newContext({ baseURL })
      const secondTab = await context.newPage()
      const emailPage = new EmailPage(secondTab)
      await emailPage.open(resetEmail.html)
      await emailPage.openResetPasswordLink()
      await new ResetPasswordPage(secondTab).expectLinkAlreadyUsed()
      await context.close()
    })
  })


  test("Forgot password form only accepts a valid email", async ({ forgotPasswordPage }) => {

    await forgotPasswordPage.open()

    await test.step("Empty email is not submitted", async () => {
      await forgotPasswordPage.requestResetLink('')
      await forgotPasswordPage.expectEmailRejected('valueMissing')
    })

    await test.step("Badly formatted email is not submitted", async () => {
      await forgotPasswordPage.requestResetLink('not-an-email')
      await forgotPasswordPage.expectEmailRejected('typeMismatch')
    })
  })


  test("Unknown email gets the same confirmation, so accounts can't be discovered", async ({ forgotPasswordPage }) => {

    await forgotPasswordPage.open()

    await forgotPasswordPage.requestResetLink(`nobody${Date.now()}@example.com`)

    await forgotPasswordPage.expectResetLinkSent()
  })
})
