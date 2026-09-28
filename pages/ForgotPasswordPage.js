import { expect } from '@playwright/test'

// "Forget Password" screen at /app/forget-password, where a reset link is requested
export class ForgotPasswordPage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Forget Password' })
    this.emailInput = page.getByPlaceholder("Enter your email address")
    this.sendEmailButton = page.getByRole('button', { name: 'Send Email' })
    this.checkEmailHeading = page.getByRole('heading', { name: 'Check your email' })
    this.resetLinkSentMessage = page.getByText('We sent a password reset link to your email')
    this.resendLink = page.getByText('Click to resend')
  }

  async open() {
    await this.page.goto("/app/forget-password")
    await expect(this.heading).toBeVisible()
  }

  async requestResetLink(email) {
    await this.emailInput.fill(email)
    await this.sendEmailButton.click()
  }

  async expectResetLinkSent() {
    await expect(this.page).toHaveURL("/app/forget-password")
    await expect(this.checkEmailHeading).toBeVisible()
    await expect(this.resetLinkSentMessage).toBeVisible()
    await expect(this.resendLink).toBeVisible()
  }

  // The email field uses the browser's own validation, so a bad value is never submitted
  async expectEmailRejected(validityFlag) {
    expect(await this.emailInput.evaluate((input, flag) => input.validity[flag], validityFlag)).toBe(true)
    await expect(this.heading).toBeVisible()
    await expect(this.checkEmailHeading).toBeHidden()
  }
}
