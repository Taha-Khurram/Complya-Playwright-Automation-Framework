import { expect } from '@playwright/test'
import { toast } from './components/Toast'

export class LoginPage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Login' })
    this.emailInput = page.getByPlaceholder('Enter your email address')
    this.passwordInput = page.getByPlaceholder('Enter Password')
    this.signInButton = page.getByRole('button', { name: 'Sign In', exact: true })
    this.forgetPasswordLink = page.getByRole('link', { name: 'Forget password' })
    this.signUpLink = page.getByRole('link', { name: 'Sign Up' })
    // On the public website, complya.com/home/
    this.websiteLoginLink = page.getByRole('link', { name: 'Login' })
    this.resendVerificationLink = page.getByText('Resend verification email')

    this.successToast = toast(page, 'Sign-in successful!')
    this.invalidCredentialsToast = toast(page, 'Invalid email or password. Please try again.')
    this.verifyEmailFirstToast = toast(page, 'Please verify your email before signing in.')
  }

  // The app's sign in page (app.complya.com/app/sign-in).
  // This is the only URL the signed-out tests open.
  async open() {
    await this.page.goto('/app/sign-in')
    // /app/ checks for a session before showing sign in, which is slow when tests run in parallel
    await expect(this.page).toHaveURL('/app/sign-in', { timeout: 20_000 })
    await expect(this.heading).toBeVisible()
  }

  async signIn(email, password) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.signInButton.click()
  }

  // Full sign in for an account that has finished onboarding
  async login(email, password) {
    await this.open()
    await this.signIn(email, password)
    // /app/ checks the session before rendering, which is slow when several tests sign in at once
    await expect(this.page).toHaveURL('/app/', { timeout: 20_000 })
    await expect(this.successToast).toBeVisible()
  }

  async expectSignInSuccess() {
    await expect(this.successToast).toBeVisible()
  }

  async expectInvalidCredentials() {
    await expect(this.invalidCredentialsToast).toBeVisible()
    await expect(this.page).toHaveURL('/app/sign-in')
    await expect(this.successToast).toBeHidden()
  }

  // Account exists but its verification link was never clicked
  async expectEmailNotVerified() {
    // Sign in waits on the server's verified check, which can take a while under parallel load
    await expect(this.verifyEmailFirstToast).toBeVisible({ timeout: 15_000 })
    await expect(this.page).toHaveURL('/app/sign-in')
    await expect(this.resendVerificationLink).toBeVisible()
  }

  async goToSignUp() {
    await this.signUpLink.click()
    await expect(this.page).toHaveURL('/app/signup')
  }

  async goToForgotPassword() {
    await this.forgetPasswordLink.click()
    await expect(this.page).toHaveURL('/app/forget-password')
  }

  // Invited staff lands here with the email already filled in
  async expectEmailPrefilled(email) {
    await expect(this.page).toHaveURL(/\/app\/sign-in/)
    await expect(this.heading).toBeVisible()
    await expect(this.emailInput).toHaveValue(email)
  }
}
