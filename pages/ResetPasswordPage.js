import { expect } from '@playwright/test'

// Screen opened from the "Reset your password" email, at /app/reset-password?oobCode=...
export class ResetPasswordPage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Reset Password' })
    this.newPasswordInput = page.getByRole('textbox', { name: 'New password' })
    this.confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm password' })
    this.resetButton = page.getByRole('button', { name: 'Reset Password' })
    this.weakPasswordToast = page.locator("//div[text()='Must be at least 8 characters']")
    this.mismatchToast = page.locator("//div[text()='Passwords do not match']")
    this.successToast = page.locator("//div[text()='Password reset successfully! You can now sign in with your new password.']")
    this.usedLinkError = page.getByRole('paragraph').filter({ hasText: 'This link is invalid. It may have already been used.' })
    this.redirectingMessage = page.getByText('Redirecting to sign in...')
  }

  // The page names the account being reset, e.g. "for someone@example.com"
  async expectOpenFor(email) {
    await expect(this.page).toHaveURL(/\/app\/reset-password\?oobCode=/)
    await expect(this.heading).toBeVisible()
    await expect(this.page.getByText(`for ${email}`, { exact: true })).toBeVisible()
  }

  async submit(newPassword, confirmPassword = newPassword) {
    await this.newPasswordInput.fill(newPassword)
    await this.confirmPasswordInput.fill(confirmPassword)
    await this.resetButton.click()
  }

  async expectRejectedWith(toast) {
    await expect(toast).toBeVisible()
    await expect(this.page).toHaveURL(/\/app\/reset-password/)
    await expect(this.heading).toBeVisible()
  }

  async resetPassword(newPassword) {
    await this.submit(newPassword)
    await expect(this.successToast).toBeVisible()
    await expect(this.page).toHaveURL("/app/sign-in")
  }

  async expectLinkAlreadyUsed() {
    await expect(this.usedLinkError).toBeVisible()
    await expect(this.redirectingMessage).toBeVisible()
    await expect(this.heading).toBeHidden()
  }
}
