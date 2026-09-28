import { expect } from '@playwright/test'

export class SignUpPage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Sign up' })
    this.emailInput = page.getByPlaceholder("Enter your email address")
    this.passwordInput = page.getByPlaceholder("Enter Password")
    this.confirmPasswordInput = page.getByPlaceholder("Confirm Password")
    this.createAccountButton = page.getByRole('button', { name: 'Create Account' })
    this.successToast = page.locator("//div[text()='Account created successfully! Please log in to continue.']")
    this.verifyEmailToast = page.locator("//div[text()='Account created Successfully! Please check your email for verification.']")

    // Password hints switch text once each rule is met
    this.specialCharHint = page.getByText('Must contain 1 special character', { exact: true })
    this.minLengthHint = page.getByText('Must be at least 8 characters', { exact: true })
    this.specialCharMet = page.getByText('Password contains a special character', { exact: true })
    this.minLengthMet = page.getByText('Password has at least 8 characters', { exact: true })
    this.passwordsMismatchError = page.getByText('Passwords must match')
  }

  async open() {
    await this.page.goto("/app/signup")
    await expect(this.heading).toBeVisible()
  }

  async fillForm(email, password, confirmPassword = password) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword)
  }

  // Self sign up: the new account must verify its email before it can log in
  async signUp(email, password) {
    await this.fillForm(email, password)
    await expect(this.specialCharMet).toBeVisible()
    await expect(this.minLengthMet).toBeVisible()
    await this.createAccountButton.click()
    await expect(this.verifyEmailToast).toBeVisible()
  }

  async expectEmailPrefilled(email) {
    // Invite link may carry a token in the query string, so match the path only
    await expect(this.page).toHaveURL(/\/app\/signup/)
    await expect(this.heading).toBeVisible()
    await expect(this.emailInput).toHaveValue(email)
  }

  // Invited staff: email is prefilled and already trusted, so no verification step
  async createAccount(password) {
    await this.passwordInput.fill(password)
    await this.confirmPasswordInput.fill(password)
    await this.createAccountButton.click()
    await expect(this.successToast).toBeVisible()
  }
}
