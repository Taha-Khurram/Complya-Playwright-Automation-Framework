import { expect } from '@playwright/test'

// "Check your email" screen after sign up, and the "Email Verified!" screen the email link opens
export class EmailVerificationPage {

  constructor(page) {
    this.page = page
    this.checkEmailHeading = page.getByRole('heading', { name: 'Check your email' })
    this.resendLink = page.getByText('Click to resend')
    this.verifiedHeading = page.getByRole('heading', { name: 'Email Verified!' })
    this.verifiedToast = page.locator("//div[text()='Email verified successfully!']")
    this.loginLink = page.getByRole('link', { name: 'Log in' })
    this.invalidLinkToast = page.locator("//div[text()='This link is invalid. It may have already been used.']")
  }

  async expectVerificationEmailSent(email) {
    await expect(this.page).toHaveURL(`/app/new-verify/${email}`)
    await expect(this.checkEmailHeading).toBeVisible()
    await expect(this.page.getByText(`We sent a verification link to ${email}`)).toBeVisible()
    await expect(this.resendLink).toBeVisible()
  }

  async expectEmailVerified() {
    await expect(this.page).toHaveURL('/app/email/verified')
    await expect(this.verifiedHeading).toBeVisible()
    await expect(this.verifiedToast).toBeVisible()
  }

  // A used or tampered verify link sends the user to sign in instead of verifying
  async expectLinkRejected() {
    await expect(this.invalidLinkToast).toBeVisible()
    await expect(this.page).toHaveURL('/app/sign-in')
    await expect(this.verifiedHeading).toBeHidden()
  }

  async goToLogin() {
    await this.loginLink.click()
    await expect(this.page).toHaveURL('/app/sign-in')
  }
}
