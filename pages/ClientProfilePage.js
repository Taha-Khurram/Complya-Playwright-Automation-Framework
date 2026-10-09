import { expect } from '@playwright/test'
import { formatTime } from '../utils/dates'
import { ClientsPage } from './ClientsPage'

// A client's profile (Clients > click a client). Opens on its Details tab; tests also use its
// Preferences, Sessions and Programs (goals) tabs. Every method takes the client object the test created,
// e.g. { firstName, lastName, ... }, and gets there by clicking.
export class ClientProfilePage {

  constructor(page) {
    this.page = page
    this.clientsPage = new ClientsPage(page)
    this.main = page.getByRole('main')
    this.rows = this.main.getByRole('row')

    // Tabs
    this.detailsTab = this.main.getByRole('button', { name: 'Detail Icon Details' })
    this.preferencesTab = this.main.getByRole('button', { name: 'Preferences Icon Preferences' })
    this.sessionsTab = this.main.getByRole('button', { name: 'Sessions Icon Sessions' })
    this.programsTab = this.main.getByRole('button', { name: 'Program Icon Programs' })

    // Details tab
    this.detailsHeading = this.main.getByRole('heading', { name: 'Details', level: 2 })
    this.firstNameInput = this.main.getByRole('textbox', { name: 'First Name *' })
    this.lastNameInput = this.main.getByRole('textbox', { name: 'Last Name *' })

    // Sessions tab
    this.sessionsHeading = this.main.getByRole('heading', { name: 'Sessions', level: 2 })
    this.pageSizeButton = this.main.getByRole('button', { name: '10', exact: true })
    // The "+" icon button on the Sessions tab
    this.createSessionButton = this.main.getByRole('button', { name: 'Create Session' })
    this.noSessionsHeading = this.main.getByRole('heading', { name: 'No Sessions Found' })

    // Preferences tab: a rich text editor that autosaves (~1.5s after typing stops) and then
    // shows a green "Saved" label
    this.preferencesEditor = this.main.locator('.client-preferences-body .tiptap').first()
    this.preferencesSaving = this.main.locator('.autosave-status-label.is-saving')
    this.preferencesSaved = this.main.locator('.autosave-status-label.is-saved')

    // Programs tab
    this.programsHeading = this.main.getByRole('heading', { name: 'Programs', level: 2 })
    this.addGoalButton = this.main.getByRole('button', { name: 'Add Goal' })
    this.newGoalOption = page.getByRole('button', { name: 'New Goal' })
  }

  // Clients > search > click the client
  async open(client) {
    await this.clientsPage.openClient(client)
    await expect(this.detailsHeading).toBeVisible()
  }

  // The Details tab shows the client's name in its form
  async expectClient(client) {
    await this.open(client)
    await expect(this.firstNameInput).toHaveValue(client.firstName)
    await expect(this.lastNameInput).toHaveValue(client.lastName)
  }

  async openSessions(client) {
    await this.open(client)
    await this.sessionsTab.click()
    await expect(this.sessionsHeading).toBeVisible()
    // Show up to 50 rows so a test's sessions are never on a later page. An empty list has no
    // page size control.
    await expect(this.pageSizeButton.or(this.noSessionsHeading)).toBeVisible()
    if (await this.noSessionsHeading.isVisible()) return
    await this.pageSizeButton.click()
    await this.page.locator('.dropdown-menu.show').getByText('50', { exact: true }).click()
  }

  // Opens the create session form with this client already selected
  async openCreateSession() {
    await this.createSessionButton.click()
    await expect(this.page).toHaveURL('/app/create-session')
  }

  // Rows read e.g. "... Upcoming CMDE 97151 ... Dec 15, 2026 09:00 AM - 10:00 AM ...". Matched by
  // date and start time, because the end changes once a session starts ("09:00 AM - Ongoing").
  sessionRow({ date, start }) {
    return this.rows.filter({ hasText: date.short }).filter({ hasText: `${formatTime(start)} -` })
  }

  async expectSessionStatus(session, status) {
    await expect(this.sessionRow(session)).toContainText(status)
  }

  async expectSessionNotListed(session) {
    await expect(this.sessionRow(session)).toHaveCount(0)
  }

  // Clicks the session's row, which opens its details (on the Sessions tab)
  async openSession(session) {
    const row = this.sessionRow(session)
    await expect(row).toHaveCount(1)
    await row.getByText(session.date.short).click()
    await expect(this.page).toHaveURL(/\/app\/session-detail\//)
  }

  // Clients > client > Sessions tab > the session's row
  async openSessionDetails(client, session) {
    await this.openSessions(client)
    await this.openSession(session)
  }

  async openPreferences(client) {
    await this.open(client)
    await this.showPreferences()
  }

  // From any tab of the open profile
  async showPreferences() {
    await this.preferencesTab.click()
    await expect(this.preferencesEditor).toBeEditable()
  }

  // Replaces everything in the Preferences editor with `text` and waits for the autosave.
  // An empty `text` clears it.
  async writePreferences(text) {
    const saved = this.page.waitForResponse(r =>
      r.request().method() === 'PATCH' && /\/clients?\/[^/]+\/preferences$/.test(new URL(r.url()).pathname))
    await this.preferencesEditor.click()
    await this.page.keyboard.press('ControlOrMeta+A')
    if (text) await this.page.keyboard.insertText(text)
    else await this.page.keyboard.press('Delete')
    expect((await saved).ok(), 'Preferences autosave should succeed').toBe(true)
    await this.expectPreferencesSaved()
  }

  // The "Saved" label is green
  async expectPreferencesSaved() {
    await expect(this.preferencesSaving).toBeHidden()
    await expect(this.preferencesSaved).toHaveText('Saved')
    const color = await this.preferencesSaved.evaluate(el => getComputedStyle(el).color)
    const [r, g, b] = color.match(/\d+/g).map(Number)
    expect(g > r && g > b, `"Saved" should be green, but its color is ${color}`).toBe(true)
  }

  // Leaves the Preferences tab and comes back, so the editor shows what the app saved
  async expectPreferencesKept(text) {
    await this.detailsTab.click()
    await expect(this.detailsHeading).toBeVisible()
    await this.showPreferences()
    await expect(this.preferencesEditor).toHaveText(text)
  }

  async openPrograms(client) {
    await this.open(client)
    await this.programsTab.click()
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
