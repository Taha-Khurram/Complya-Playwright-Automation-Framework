import { expect } from '@playwright/test'
import { timeRange } from '../utils/dates'

// A client's profile at /app/client-tabs/<id>; tests use its Sessions and Programs (goals) tabs
export class ClientProfilePage {

  constructor(page) {
    this.page = page
    this.main = page.getByRole('main')
    this.rows = this.main.getByRole('row')

    // Details tab
    this.detailsHeading = this.main.getByRole('heading', { name: 'Details', level: 2 })
    this.firstNameInput = this.main.getByRole('textbox', { name: 'First Name *' })
    this.lastNameInput = this.main.getByRole('textbox', { name: 'Last Name *' })

    // Sessions tab
    this.sessionsHeading = this.main.getByRole('heading', { name: 'Sessions', level: 2 })
    this.pageSizeButton = this.main.getByRole('button', { name: '10', exact: true })

    // Programs tab
    this.programsHeading = this.main.getByRole('heading', { name: 'Programs', level: 2 })
    this.addGoalButton = this.main.getByRole('button', { name: 'Add Goal' })
    this.newGoalOption = page.getByRole('button', { name: 'New Goal' })
  }

  // Profile opens on its Details tab, with the client's name in the form
  async expectClient(clientId, { firstName, lastName }) {
    await this.page.goto(`/app/client-tabs/${clientId}`)
    await expect(this.detailsHeading).toBeVisible()
    await expect(this.firstNameInput).toHaveValue(firstName)
    await expect(this.lastNameInput).toHaveValue(lastName)
  }

  async openSessions(clientId) {
    await this.page.goto(`/app/client-tabs/${clientId}?tab=sessions`)
    await expect(this.sessionsHeading).toBeVisible()
    // Show up to 50 rows so a test's sessions are never on a later page
    await this.pageSizeButton.click()
    await this.page.locator('.dropdown-menu.show').getByText('50', { exact: true }).click()
  }

  // Rows read e.g. "... Upcoming CMDE 97151 ... Dec 15, 2026 09:00 AM - 10:00 AM ..."
  sessionRow({ date, start, end }) {
    return this.rows.filter({ hasText: date.short }).filter({ hasText: timeRange(start, end).list })
  }

  async expectSessionStatus(session, status) {
    await expect(this.sessionRow(session)).toContainText(status)
  }

  async expectSessionNotListed(session) {
    await expect(this.sessionRow(session)).toHaveCount(0)
  }

  // Opens the session from its row and returns its id, from /app/session-detail/<id>
  async openSession(session) {
    const row = this.sessionRow(session)
    await expect(row).toHaveCount(1)
    await row.getByText(session.date.short).click()
    await this.page.waitForURL(/\/app\/session-detail\/[^/?]+/)
    return new URL(this.page.url()).pathname.split('/').pop()
  }

  async openPrograms(clientId) {
    await this.page.goto(`/app/client-tabs/${clientId}?tab=program`)
    await expect(this.programsHeading).toBeVisible()
  }

  async addNewGoal() {
    await this.addGoalButton.click()
    await this.newGoalOption.click()
    await expect(this.page).toHaveURL('/app/create-goal')
  }

  // Rows read e.g. "Trials Skills Acquisition Trials 0 9/7/2026 9/7/2026 In Progress"
  goalRow(name) {
    return this.rows.filter({ has: this.page.getByRole('paragraph').filter({ hasText: new RegExp(`^${name}$`) }) })
  }
}
