import { expect } from '@playwright/test'

// Screen shown to invited staff after their first sign in
export class AcceptInvitePage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Accept Invite' })
    this.acceptButton = page.getByRole('button', { name: 'Accept', exact: true })
  }

  // staffName is the invited staff's full name, shown in the dashboard greeting
  async accept(staffName) {
    await expect(this.heading).toBeVisible()
    await this.acceptButton.click()
    // Accepting shows no toast, so the dashboard greeting is the proof it worked.
    // Staff dashboard greets the user, e.g. "Good Afternoon, Playwright Staff"
    await expect(this.page).toHaveURL("/app/")
    await expect(this.page.getByText(new RegExp(`Good \\w+, ${staffName}`))).toBeVisible()
  }
}
