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

    // Email checks run in the app, not the browser, and show under the field
    this.emailRequiredError = page.getByText('Email is required', { exact: true })
    this.invalidEmailError = page.getByText('Invalid email address', { exact: true })
    this.duplicateEmailToast = page.locator("//div[text()='An account with this email already exists']")

    // Eye button inside each password field; its label flips between "Show password" and "Hide password"
    this.passwordToggle = page.locator('.has-password-toggle', { has: this.passwordInput }).locator('.password-eye-toggle')
    this.confirmPasswordToggle = page.locator('.has-password-toggle', { has: this.confirmPasswordInput }).locator('.password-eye-toggle')

    this.loginLink = page.getByRole('link', { name: 'Log In' })
    this.termsLink = page.getByRole('link', { name: 'Terms and Conditions' })
    this.privacyLink = page.getByRole('link', { name: 'Privacy Policy' })
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

  async submit(email, password, confirmPassword = password) {
    await this.fillForm(email, password, confirmPassword)
    await this.createAccountButton.click()
  }

  // Collects calls to Firebase's sign up endpoint, so a test can prove a rejected form never reached the server
  watchSignUpRequests() {
    const requests = []
    this.page.on('request', request => {
      if (request.url().includes('accounts:signUp')) requests.push(request)
    })
    return requests
  }

  // Form was not accepted: still on sign up, showing `error`
  async expectRejectedWith(error) {
    await expect(error).toBeVisible()
    await expect(this.page).toHaveURL('/app/signup')
    await expect(this.heading).toBeVisible()
  }

  // Each hint shows its "met" text once the rule passes, e.g. { minLength: true, specialChar: false }
  async expectPasswordRules({ minLength, specialChar }) {
    await expect(minLength ? this.minLengthMet : this.minLengthHint).toBeVisible()
    await expect(specialChar ? this.specialCharMet : this.specialCharHint).toBeVisible()
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
