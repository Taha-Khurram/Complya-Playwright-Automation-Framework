import { test, expect } from '../../fixtures'
import { admin, newOwner, signUpForm } from '../../test-data/testData'
import { createInbox } from '../../utils/mailbox'

test.describe('Sign up', () => {

  test.describe('Positive', () => {

    // The verifiedOwner fixture waits for a real verification email
    test.describe.configure({ timeout: 180_000 })

    test('New user signs up, verifies their email and is taken to onboarding on first sign in', async ({
      page, verifiedOwner, emailVerificationPage, loginPage,
    }) => {

      await test.step('Sign in from the "Email Verified!" screen', async () => {
        await emailVerificationPage.goToLogin()
        await loginPage.signIn(verifiedOwner.email, verifiedOwner.password)
        await loginPage.expectSignInSuccess()
      })

      await test.step('A new account starts onboarding', async () => {
        await expect(page).toHaveURL('/app/onboarding')
      })
    })
  })


  test.describe('Negative', () => {

    test('Badly formatted emails are rejected before reaching the server', async ({ signUpPage }) => {

      await signUpPage.open()
      const signUpRequests = signUpPage.watchSignUpRequests()

      await test.step('Empty email', async () => {
        await signUpPage.submit('', newOwner.password)
        await signUpPage.expectRejectedWith(signUpPage.emailRequiredError)
      })

      for (const email of signUpForm.invalidEmails) {
        await test.step(`Invalid email "${email}"`, async () => {
          await signUpPage.submit(email, newOwner.password)
          await signUpPage.expectRejectedWith(signUpPage.invalidEmailError)
        })
      }

      expect(signUpRequests, 'No sign up request should be sent for an invalid email').toHaveLength(0)
    })


    test('Weak passwords keep Create Account disabled', async ({ signUpPage }) => {

      await signUpPage.open()

      for (const { label, value, rules } of signUpForm.weakPasswords) {
        await test.step(`Password ${label}`, async () => {
          await signUpPage.fillForm('someone@example.com', value)
          await signUpPage.expectPasswordRules(rules)
          await expect(signUpPage.createAccountButton).toBeDisabled()
        })
      }
    })


    test('Mismatched confirm password is rejected', async ({ signUpPage }) => {

      await signUpPage.open()
      const signUpRequests = signUpPage.watchSignUpRequests()

      // Both passwords meet the rules on their own, so only the mismatch blocks sign up
      await signUpPage.submit('someone@example.com', newOwner.password, 'Different@1234')

      await signUpPage.expectRejectedWith(signUpPage.passwordsMismatchError)
      expect(signUpRequests, 'No sign up request should be sent when passwords differ').toHaveLength(0)
    })


    test('An email that already has an account cannot sign up again', async ({ signUpPage }) => {

      test.skip(!admin.email, 'ADMIN_EMAIL is not set')

      await signUpPage.open()
      await signUpPage.submit(admin.email, newOwner.password)

      await signUpPage.expectRejectedWith(signUpPage.duplicateEmailToast)
    })


    test('A new account cannot sign in until its email is verified', async ({ request, signUpPage, loginPage }) => {

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
})
