import { expect } from '@playwright/test'

// Read-only session summary at /app/session-detail/<id>
export class SessionDetailPage {

  constructor(page) {
    this.page = page
    this.main = page.getByRole('main')
    this.heading = this.main.getByRole('heading', { name: 'Session Details' })
  }

  async visit(sessionId) {
    await this.page.goto(`/app/session-detail/${sessionId}`)
    await expect(this.heading).toBeVisible()
  }

  // Each value sits in the <strong> after its label, e.g. "Status" -> "Upcoming"
  field(label) {
    return this.main.getByText(label, { exact: true }).locator('xpath=following::strong[1]')
  }

  // Pass only the fields to check, e.g. { status: 'Cancelled' }
  async expectDetails({ date, time, client, staff, serviceType, status }) {
    if (date) await expect(this.field('Date')).toHaveText(date)
    if (time) await expect(this.field('Time')).toHaveText(time)
    if (client) await expect(this.field('Client Name')).toHaveText(client)
    if (staff) await expect(this.field('Staff Name')).toHaveText(staff)
    if (serviceType) await expect(this.field('Service Type')).toHaveText(serviceType)
    if (status) await expect(this.field('Status')).toHaveText(status)
  }
}
