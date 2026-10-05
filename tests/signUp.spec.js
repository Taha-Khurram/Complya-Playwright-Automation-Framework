import { test, expect } from '../fixtures'
import { admin, newOwner, signUpForm, workspace } from '../test-data/testData'
import { createInbox, waitForEmail } from '../utils/mailbox'
import { EmailPage } from '../pages/EmailPage'
import { EmailVerificationPage } from '../pages/EmailVerificationPage'

test.describe("New user sign up", () => {

  test.describe("Positive", () => {

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


    test("A strong password meets every rule and enables Create Account", async ({ signUpPage }) => {

      await signUpPage.open()
      await expect(signUpPage.createAccountButton).toBeDisabled()

      await signUpPage.fillForm('someone@example.com', newOwner.password)

      await signUpPage.expectPasswordRules({ minLength: true, specialChar: true })
      await expect(signUpPage.createAccountButton).toBeEnabled()
    })


    test("Common valid email formats are accepted", async ({ signUpPage }) => {

      await signUpPage.open()

      for (const email of signUpForm.validEmails) {
        await test.step(email, async () => {
          await signUpPage.emailInput.fill(email)
          // The email check runs when the field loses focus
          await signUpPage.emailInput.blur()
          await expect(signUpPage.invalidEmailError).toBeHidden()
          await expect(signUpPage.emailRequiredError).toBeHidden()
        })
      }
    })


    test("Each password field can be shown and hidden on its own", async ({ signUpPage }) => {

      await signUpPage.open()
      await signUpPage.fillForm('someone@example.com', newOwner.password)

      await test.step("Show the password", async () => {
        await signUpPage.passwordToggle.click()
        await expect(signUpPage.passwordInput).toHaveAttribute('type', 'text')
        await expect(signUpPage.passwordToggle).toHaveAttribute('aria-label', 'Hide password')
        // The confirm field is unaffected
        await expect(signUpPage.confirmPasswordInput).toHaveAttribute('type', 'password')
      })

      await test.step("Show the confirm password", async () => {
        await signUpPage.confirmPasswordToggle.click()
        await expect(signUpPage.confirmPasswordInput).toHaveAttribute('type', 'text')
      })

      await test.step("Hide both again, values unchanged", async () => {
        await signUpPage.passwordToggle.click()
        await signUpPage.confirmPasswordToggle.click()
        await expect(signUpPage.passwordInput).toHaveAttribute('type', 'password')
        await expect(signUpPage.confirmPasswordInput).toHaveAttribute('type', 'password')
        await expect(signUpPage.passwordToggle).toHaveAttribute('aria-label', 'Show password')
        await expect(signUpPage.passwordInput).toHaveValue(newOwner.password)
      })
    })


    test("Sign up page links to log in and the legal pages", async ({ signUpPage }) => {

      await signUpPage.open()

      await expect(signUpPage.termsLink).toHaveAttribute('href', 'https://complya.com/home/termsservices')
      await expect(signUpPage.privacyLink).toHaveAttribute('href', 'https://complya.com/home/privacy')

      await signUpPage.loginLink.click()
      await expect(signUpPage.page).toHaveURL('/app/sign-in')
    })
  })


  test.describe("Negative", () => {

    test("Empty or badly formatted email is never sent to the server", async ({ signUpPage }) => {

      await signUpPage.open()
      const signUpRequests = signUpPage.watchSignUpRequests()

      await test.step("Empty email", async () => {
        await signUpPage.submit('', newOwner.password)
        await signUpPage.expectRejectedWith(signUpPage.emailRequiredError)
      })

      for (const email of signUpForm.invalidEmails) {
        await test.step(`Invalid email: ${email}`, async () => {
          await signUpPage.submit(email, newOwner.password)
          await signUpPage.expectRejectedWith(signUpPage.invalidEmailError)
        })
      }

      expect(signUpRequests).toHaveLength(0)
    })


    test("Passwords that break a rule keep Create Account disabled", async ({ signUpPage }) => {

      await signUpPage.open()

      for (const { label, value, rules } of signUpForm.weakPasswords) {
        await test.step(`Password ${label}`, async () => {
          await signUpPage.fillForm('someone@example.com', value)
          await signUpPage.expectPasswordRules(rules)
          await expect(signUpPage.createAccountButton).toBeDisabled()
        })
      }
    })


    test("Mismatched confirm password is rejected", async ({ signUpPage }) => {

      await signUpPage.open()
      const signUpRequests = signUpPage.watchSignUpRequests()

      // Both passwords meet the rules on their own, so only the mismatch blocks sign up
      await signUpPage.submit('someone@example.com', newOwner.password, 'Different@1234')

      await signUpPage.expectRejectedWith(signUpPage.passwordsMismatchError)
      expect(signUpRequests).toHaveLength(0)
    })


    test("An email that already has an account can't sign up again", async ({ signUpPage }) => {

      test.skip(!admin.email, 'ADMIN_EMAIL is not set')

      await signUpPage.open()

      await signUpPage.submit(admin.email, newOwner.password)

      await signUpPage.expectRejectedWith(signUpPage.duplicateEmailToast)
    })


    test("A new account can't sign in until its email is verified", async ({ request, signUpPage, loginPage }) => {

      // Signs up and signs in against the live site, which is slow when tests run in parallel
      test.setTimeout(90_000)

      const inbox = await createInbox(request, 'unverified')

      await signUpPage.open()
      await signUpPage.signUp(inbox.address, newOwner.password)

      // Correct credentials, but the verification link was never clicked
      await loginPage.open()
      await loginPage.signIn(inbox.address, newOwner.password)

      await loginPage.expectEmailNotVerified()
      await expect(loginPage.successToast).toBeHidden()
    })
  })


  test.describe("Edge", () => {

    test("Password length boundary: 7 characters is rejected, 8 is accepted", async ({ signUpPage }) => {

      await signUpPage.open()

      await test.step("7 characters", async () => {
        await signUpPage.fillForm('someone@example.com', signUpForm.oneCharTooShort)
        await signUpPage.expectPasswordRules({ minLength: false, specialChar: true })
        await expect(signUpPage.createAccountButton).toBeDisabled()
      })

      await test.step("8 characters", async () => {
        await signUpPage.fillForm('someone@example.com', signUpForm.shortestValidPassword)
        await signUpPage.expectPasswordRules({ minLength: true, specialChar: true })
        await expect(signUpPage.createAccountButton).toBeEnabled()
      })
    })


    test("Duplicate email check ignores letter case", async ({ signUpPage }) => {

      test.skip(!admin.email, 'ADMIN_EMAIL is not set')

      await signUpPage.open()

      await signUpPage.submit(admin.email.toUpperCase(), newOwner.password)

      await signUpPage.expectRejectedWith(signUpPage.duplicateEmailToast)
    })


    test("Email with leading or trailing spaces is not accepted", async ({ signUpPage }) => {

      await signUpPage.open()
      const signUpRequests = signUpPage.watchSignUpRequests()

      // The form doesn't trim, so this must not be registered as a different address
      await signUpPage.submit('  someone@example.com  ', newOwner.password)

      await signUpPage.expectRejectedWith(signUpPage.invalidEmailError)
      expect(signUpRequests).toHaveLength(0)
    })


    test("Verification link works once, and a tampered link is rejected", async ({
      page, browser, baseURL, request, signUpPage, emailVerificationPage,
    }) => {

      test.setTimeout(180_000)

      const inbox = await createInbox(request, 'verify')
      let verificationEmail

      await test.step("Sign up and verify once", async () => {
        await signUpPage.open()
        await signUpPage.signUp(inbox.address, newOwner.password)
        verificationEmail = await waitForEmail(request, inbox, /verify your email/i)

        const emailPage = new EmailPage(page)
        await emailPage.open(verificationEmail.html)
        await emailPage.verifyEmail()
        await emailVerificationPage.expectEmailVerified()
      })

      // A clean browser session, like opening the email again on another device
      const context = await browser.newContext({ baseURL })
      const secondTab = await context.newPage()
      const secondEmailPage = new EmailPage(secondTab)
      const secondVerificationPage = new EmailVerificationPage(secondTab)

      await test.step("Same link opened again", async () => {
        await secondEmailPage.open(verificationEmail.html)
        await secondEmailPage.openVerifyEmailLink()
        await secondVerificationPage.expectLinkRejected()
      })

      await test.step("Link with a tampered code", async () => {
        await secondEmailPage.open(verificationEmail.html)
        const link = await secondEmailPage.verifyEmailLink.getAttribute('href')
        await secondTab.goto(link.replace(/oobCode=[^&]+/, 'oobCode=tampered123'))
        await secondVerificationPage.expectLinkRejected()
      })

      await context.close()
    })


    test("Refreshing the check your email screen keeps the user on it", async ({ page, request, signUpPage, emailVerificationPage }) => {

      // Known bug: /app/new-verify/<email> returns the server's 404 page on a full load, because the
      // dot in the email (".com") makes the server treat the path as a file. Remove test.fail once fixed.
      test.fail(true, 'Server 404s on a hard load of /app/new-verify/<email>')

      const inbox = await createInbox(request, 'refresh')

      await signUpPage.open()
      await signUpPage.signUp(inbox.address, newOwner.password)
      await emailVerificationPage.expectVerificationEmailSent(inbox.address)

      await page.reload()

      await emailVerificationPage.expectVerificationEmailSent(inbox.address)
    })
  })
})
