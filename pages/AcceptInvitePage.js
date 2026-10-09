import { expect } from '@playwright/test'

// Screen shown to invited staff after their first sign in
export class AcceptInvitePage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Accept Invite' })
    this.acceptButton = page.getByRole('button', { name: 'Accept', exact: true })

    // Known app bug: the invite's sign up page checks the session before the account exists,
    // gets a 401, and the app never checks again after sign in. It then shows this dialog
    // until the page is reloaded. Fast (headless) runs hit it; slower manual ones usually don't.
    this.workspaceErrorDialog = page.getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: "Couldn't Load Your Workspace" }) })
    this.reloadButton = this.workspaceErrorDialog.getByRole('button', { name: 'Reload' })
  }

  // Waits for the invite after sign in. If the known "Couldn't Load Your Workspace" bug shows,
  // uses the dialog's own Reload button, as a user would. Returns true when that was needed.
  async waitForInvite() {
    await expect(this.heading.or(this.workspaceErrorDialog)).toBeVisible({ timeout: 15_000 })
    const hitKnownBug = await this.workspaceErrorDialog.isVisible()
    if (hitKnownBug) await this.reloadButton.click()
    // After a reload the app boots again before showing the invite
    await expect(this.heading).toBeVisible({ timeout: 30_000 })
    return hitKnownBug
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
