// Renders a received email in a browser tab so its buttons can be clicked like a real inbox
export class EmailPage {

  constructor(page) {
    this.page = page
    this.acceptInvitationLink = page.locator('a', { hasText: /accept invitation/i })
    this.verifyEmailLink = page.locator('a[href*="mode=verifyEmail"]')
    this.resetPasswordLink = page.locator('a[href*="mode=resetPassword"]')
  }

  async open(html) {
    await this.page.setContent(html)
  }

  // Clicks "Accept Invitation" and follows the link in this same tab
  async acceptInvitation() {
    await this.acceptInvitationLink.scrollIntoViewIfNeeded()
    // Email links usually have target="_blank"; remove it so the link doesn't open a new tab
    await this.acceptInvitationLink.evaluate(link => link.removeAttribute('target'))
    await this.acceptInvitationLink.click()
    await this.page.waitForURL(/complya\.com\/app\//)
  }

  // Clicks the link in the "Verify your email" email sent after sign up
  async verifyEmail() {
    await this.verifyEmailLink.click()
    await this.page.waitForURL(/complya\.com\/app\/email\/verified/)
  }

  // Clicks the link in the "Reset your password" email. Where it lands depends on
  // whether the link was already used, so the caller checks the page.
  async openResetPasswordLink() {
    await this.resetPasswordLink.click()
    await this.page.waitForURL(/complya\.com\/app\//)
  }
}
