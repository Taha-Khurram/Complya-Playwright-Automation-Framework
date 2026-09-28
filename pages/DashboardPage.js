import { expect } from '@playwright/test'
import { Sidebar } from './components/Sidebar'

// Home screen at /app/
export class DashboardPage {

  constructor(page) {
    this.page = page
    this.sidebar = new Sidebar(page)
    this.homeHeading = page.getByRole('main').getByRole('heading', { name: 'Home' })
    this.tourProgress = page.getByText('1 of 12')
    this.closeTourButton = page.getByRole('button', { name: 'Close Tour' })
  }

  // Greets the user by time of day, e.g. "Good Afternoon, Playwright Owner"
  async expectWelcome(fullName) {
    await expect(this.page).toHaveURL('/app/')
    await expect(this.homeHeading).toBeVisible()
    await expect(this.page.getByRole('heading', { name: new RegExp(`Good \\w+, ${fullName}`) })).toBeVisible()
  }

  // Name and email in the sidebar's profile button only show while the sidebar is expanded
  async expectSignedInAs(fullName, email) {
    await this.sidebar.expand()
    await expect(this.page.getByRole('button', { name: `Profile ${fullName} ${email}` })).toBeVisible()
  }

  // A product tour starts on the dashboard for new users
  async closeTour() {
    await expect(this.tourProgress).toBeVisible()
    await this.closeTourButton.click()
    await expect(this.closeTourButton).toBeHidden()
  }
}
