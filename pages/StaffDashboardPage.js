import { expect } from '@playwright/test'
import { Sidebar } from './components/Sidebar'

// Staff dashboard at /app/dashboard. Staff permission lands here; Admin, Manager
// and Clinical reach it with "Go to Staff".
export class StaffDashboardPage {

  constructor(page) {
    this.page = page
    this.sidebar = new Sidebar(page)
    this.upcomingCount = page.getByText('Upcoming', { exact: true })
    this.completedCount = page.getByText('Completed', { exact: true })
    this.scheduleHeading = page.getByRole('heading', { name: 'This Weeks Schedule' })
    this.calendarButton = page.getByRole('button', { name: 'Calendar' })
    this.inboxLink = page.getByRole('link', { name: 'Inbox' })
    this.messagesLink = page.getByRole('link', { name: 'Messages' })
    this.profileButton = page.getByRole('button', { name: 'Profile', exact: true })
    this.menuItems = page.getByRole('menuitem')
    this.goToAdminItem = page.getByRole('menuitem', { name: 'Go to Admin' })
  }

  // Greets the user by time of day, e.g. "Good Evening, Playwright Staff"
  async expectWelcome(fullName) {
    await expect(this.page).toHaveURL('/app/dashboard')
    await expect(this.page.getByRole('heading', { level: 2, name: new RegExp(`Good \\w+, ${fullName}`) })).toBeVisible()
    await expect(this.upcomingCount).toBeVisible()
    await expect(this.completedCount).toBeVisible()
    await expect(this.scheduleHeading).toBeVisible()
    await expect(this.calendarButton).toBeVisible()
    await expect(this.inboxLink).toBeVisible()
    await expect(this.messagesLink).toBeVisible()
    // The staff dashboard has a bottom bar instead of the admin sidebar
    await expect(this.sidebar.wrapper).toBeHidden()
  }

  // items: menu labels in order, e.g. ['Profile', 'Go to Admin', 'Workspaces', 'Sign Out']
  async expectProfileMenu(items) {
    await this.profileButton.click()
    await expect(this.menuItems).toHaveText(items)
    await this.page.keyboard.press('Escape')
  }

  async goToAdminDashboard() {
    await this.profileButton.click()
    await this.goToAdminItem.click()
    await expect(this.page).toHaveURL('/app/')
  }
}
