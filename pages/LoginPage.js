import { expect } from '@playwright/test'

export class LoginPage {

  constructor(page) {
    this.page = page
    this.loginLink = page.getByText("Login")
    this.heading = page.getByRole('heading', { name: 'Login' })
    this.emailInput = page.getByPlaceholder("Enter your email address")
    this.passwordInput = page.getByPlaceholder("Enter Password")
    this.signInButton = page.getByRole('button', { name: 'Sign In', exact: true })
    this.successToast = page.locator("//div[text()='Sign-in successful!']")
    this.invalidCredentialsToast = page.locator("//div[text()='Invalid email or password. Please try again.']")
    this.forgetPasswordLink = page.getByRole('link', { name: 'Forget password' })
    this.verifyEmailFirstToast = page.locator("//div[text()='Please verify your email before signing in. Check your inbox for the verification link.']")
    this.resendVerificationLink = page.getByText('Resend verification email')
  }

  async open() {
    await this.page.goto("/home/")
    await this.loginLink.click()
    // The link opens /app/, which checks for a session before redirecting - slow when tests run in parallel
    await expect(this.page).toHaveURL("/app/sign-in", { timeout: 15_000 })
  }

  async signIn(email, password) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.signInButton.click()
  }

  // Full login from the home page, used by every admin test
  async login(email, password) {
    await this.open()
    await this.signIn(email, password)
    await expect(this.page).toHaveURL("/app/")
    await this.expectSignInSuccess()
  }

  async expectSignInSuccess() {
    await expect(this.successToast).toBeVisible()
  }

  async expectInvalidCredentials() {
    await expect(this.invalidCredentialsToast).toBeVisible()
    await expect(this.page).toHaveURL("/app/sign-in")
  }

  // Account exists but its email link was never clicked
  async expectEmailNotVerified() {
    await expect(this.verifyEmailFirstToast).toBeVisible()
    await expect(this.page).toHaveURL("/app/sign-in")
    await expect(this.resendVerificationLink).toBeVisible()
  }

  async goToForgotPassword() {
    await this.forgetPasswordLink.click()
    await expect(this.page).toHaveURL("/app/forget-password")
  }

  // Invited staff lands here with the email already filled in
  async expectEmailPrefilled(email) {
    await expect(this.page).toHaveURL(/\/app\/sign-in/)
    await expect(this.heading).toBeVisible()
    await expect(this.emailInput).toHaveValue(email)
  }
}
