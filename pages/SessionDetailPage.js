import { expect } from '@playwright/test'
import { toast } from './components/Toast'

// Session summary at /app/session-detail/<id>, opened by clicking a session's row
// (see ClientProfilePage.openSessionDetails)
export class SessionDetailPage {

  constructor(page) {
    this.page = page
    this.main = page.getByRole('main')
    this.heading = this.main.getByRole('heading', { name: 'Session Details' })
    this.startButton = this.main.getByRole('button', { name: 'Start Session' })
    this.startedToast = toast(page, 'Session started')
    this.addNoteButton = this.main.getByRole('button', { name: 'Add Note' })
    this.viewNoteButton = this.main.getByRole('button', { name: 'View Note' })
    this.viewLogsButton = this.main.getByRole('button', { name: 'View Logs' })
    this.submittedForReview = this.main.getByText('Submitted for Review')
    this.logsDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Session Logs' }) })
  }

  // Starting opens the session's goal screen (for service types that track goals)
  async startSession() {
    await this.startButton.click()
    await expect(this.startedToast).toBeVisible()
    await expect(this.page).toHaveURL(/\/app\/goal-attempt\?/)
  }

  // The log of an ended session reads "This session went on for: ... Total Duration 3:49 PM - 3:52 PM"
  async expectSessionEnded() {
    await this.viewLogsButton.click()
    await expect(this.logsDialog.getByRole('heading', { name: 'This session went on for:' })).toBeVisible()
    await expect(this.logsDialog.getByText('Total Duration', { exact: true })).toBeVisible()
    await this.logsDialog.getByRole('button', { name: 'Close' }).first().click()
    await expect(this.logsDialog).toBeHidden()
  }

  // Opens the submitted note (read-only Summary on the goal screen)
  async openNote() {
    await this.viewNoteButton.click()
    await expect(this.page).toHaveURL(/\/app\/goal-attempt\?.*hasNote=true/)
  }

  // Reopens the note of a session that is in progress, on its Goals step
  async continueNote() {
    await this.addNoteButton.click()
    await expect(this.page).toHaveURL(/\/app\/goal-attempt\?/)
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
