import { expect } from '@playwright/test'
import { timeRange } from '../utils/dates'

// Schedule (calendar) at /app/calender, where sessions are added. Opens in Week view on the
// Client tab: one row per client, with a cell per day (Sun-Sat) holding that day's sessions.
export class SchedulePage {

  constructor(page) {
    this.page = page
    this.main = page.getByRole('main')
    this.heading = this.main.getByRole('heading', { name: 'Schedule' })
    this.addButton = this.main.getByRole('button', { name: 'Add', exact: true })
    this.weekLabel = this.main.locator('.calendar-date-nav-label')
    this.nextWeekButton = this.main.locator('.calendar-date-nav-btn').last()
    this.searchInput = this.main.getByRole('textbox', { name: 'Search' })
    this.personCards = this.main.locator('.resource-timeline-person-card')
    this.gridRows = this.main.locator('.resource-timeline-grid-row')
  }

  async visit() {
    await this.page.goto('/app/calender')
    // A full page load shows the app's "Complya . . ." boot screen first, which can be slow
    await expect(this.heading).toBeVisible({ timeout: 30_000 })
  }

  async addSession() {
    await this.addButton.click()
    await expect(this.page).toHaveURL('/app/create-session')
  }

  // Steps forward from the current week to the week holding `date` (from daysFromToday())
  async goToWeekOf(date) {
    const weekStart = d => { const s = new Date(d); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - s.getDay()); return s }
    const weeks = Math.round((weekStart(parseInput(date)) - weekStart(new Date())) / (7 * 24 * 60 * 60 * 1000))
    for (let i = 0; i < weeks; i++) {
      const label = await this.weekLabel.innerText()
      await this.nextWeekButton.click()
      await expect(this.weekLabel).not.toHaveText(label)
    }
  }

  // Clicks the session's card in the client's row, which opens its edit form.
  // Cards are titled "<service> - 9:00 AM - 10:00 AM".
  async openSession({ client, date, start, end }) {
    await this.goToWeekOf(date)
    // Search matches on the server and may return other clients too; the last name is unique
    await this.searchInput.fill(client.lastName)
    const card = this.personCards.filter({ has: this.page.getByTitle(client.fullName, { exact: true }) })
    await expect(card).toHaveCount(1)
    // Grid rows line up with the client cards beside them
    const names = await this.personCards.locator('.resource-timeline-person-name').allInnerTexts()
    const row = this.gridRows.nth(names.indexOf(client.fullName))
    const dayCell = row.locator('.resource-timeline-grid-cell').nth(parseInput(date).getDay())
    await dayCell.locator(`.resource-timeline-event-card[title$=" - ${timeRange(start, end).detail}"]`).click()
    await expect(this.page).toHaveURL(/\/app\/edit-session\//)
  }
}

// "12/15/2026" -> Date
function parseInput(date) {
  const [month, day, year] = date.input.split('/').map(Number)
  return new Date(year, month - 1, day)
}
