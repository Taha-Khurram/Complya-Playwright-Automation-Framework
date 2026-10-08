import { expect } from '@playwright/test'
import { toast } from './components/Toast'

// "Check your email" screen after sign up, and the "Email Verified!" screen the email link opens
export class EmailVerificationPage {

  constructor(page) {
    this.page = page
    this.checkEmailHeading = page.getByRole('heading', { name: 'Check your email' })
    this.resendLink = page.getByText('Click to resend')
    this.verifiedHeading = page.getByRole('heading', { name: 'Email Verified!' })
    this.loginLink = page.getByRole('link', { name: 'Log in' })
    this.verifiedToast = toast(page, 'Email verified successfully!')
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

  async goToLogin() {
    await this.loginLink.click()
    await expect(this.page).toHaveURL('/app/sign-in')
  }
}
