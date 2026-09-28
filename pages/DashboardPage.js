import { expect } from '@playwright/test'
import { Sidebar } from './components/Sidebar'

// Admin dashboard at /app/, used by the Admin, Manager and Clinical permissions
export class DashboardPage {

  constructor(page) {
    this.page = page
    this.sidebar = new Sidebar(page)
    this.homeHeading = page.getByRole('main').getByRole('heading', { name: 'Home' })
    // Tour length depends on the permission, e.g. "1 of 12" for Admin
    this.tourProgress = page.getByText(/^1 of \d+$/)
    this.closeTourButton = page.getByRole('button', { name: 'Close Tour' })
    this.profileButton = page.getByRole('button', { name: /^Profile / })
    this.goToStaffButton = page.getByRole('button', { name: 'Go to Staff' })
    this.accountSettingsLink = page.getByRole('link', { name: 'Account Settings' })
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

  // links: sidebar labels in order, e.g. ['Home', 'Clients', ...]
  async expectSidebarLinks(links) {
    await this.sidebar.expand()
    await expect(this.sidebar.links).toHaveText(links)
  }

  async openProfileMenu() {
    await this.sidebar.expand()
    await this.profileButton.click()
    await expect(this.goToStaffButton).toBeVisible()
  }

  async goToStaffDashboard() {
    await this.openProfileMenu()
    await this.goToStaffButton.click()
    await expect(this.page).toHaveURL('/app/dashboard')
  }

  // A product tour starts on the dashboard for new users
  async closeTour() {
    await expect(this.tourProgress).toBeVisible()
    await this.closeTourButton.click()
    await expect(this.closeTourButton).toBeHidden()
  }
}
