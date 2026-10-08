import { expect } from '@playwright/test'
import { toast } from './components/Toast'

const SCOPE_LABELS = { this: 'This session', future: 'This and all future sessions' }

// Create session form (/app/create-session) and edit session form (/app/edit-session/<id>).
// After Create, Update, Cancel or Delete the app goes back one page in history, so these
// forms must always be opened from another app page, never as the first page in a tab.
export class SessionFormPage {

  constructor(page) {
    this.page = page
    this.main = page.getByRole('main')
    this.editHeading = this.main.getByRole('heading', { name: 'Edit Session' })
    this.dateInput = this.main.getByRole('textbox', { name: 'Select Date' })
    this.repeatsDropdown = this.main.getByRole('button', { name: 'Doesn’t Repeat' })
    this.staffDropdown = this.main.getByRole('button', { name: 'Select Staff' })
    this.staffSearch = page.getByRole('textbox', { name: 'Search staff...' })
    this.clientDropdown = this.main.getByRole('button', { name: 'Select Client' })
    this.clientSearch = page.getByRole('textbox', { name: 'Search client...' })
    this.serviceTypeDropdown = this.main.getByRole('button', { name: 'Select Service Type' })
    this.modalityDropdown = this.main.getByRole('button', { name: 'Select modality' })
    this.startTimeInput = this.main.locator('input[name="session-0-startTime"]')
    this.endTimeInput = this.main.locator('input[name="session-0-endTime"]')
    this.createButton = this.main.getByRole('button', { name: 'Create', exact: true })
    this.updateButton = this.main.getByRole('button', { name: 'Update', exact: true })
    this.actionsButton = this.main.getByRole('button', { name: 'Session actions' })
    this.actionsMenu = page.locator('.dropdown-menu.show')

    this.recurrenceDialog = page.getByRole('dialog').filter({ hasText: 'Custom Recurrence' })
    this.cancelDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Cancel Session', exact: true }) })
    this.cancelReasonDropdown = this.cancelDialog.getByRole('button', { name: 'Reason for Cancellation:' })
    this.confirmCancelButton = this.cancelDialog.getByRole('button', { name: 'Cancel Session', exact: true })
    this.deleteDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Delete Session', exact: true }) })
    this.confirmDeleteButton = this.deleteDialog.getByRole('button', { name: 'Delete', exact: true })

    // Validation errors show as toasts
    this.staffRequiredError = toast(page, 'Please select at least one staff member')
    this.pastDateError = toast(page, 'Date cannot be in the past')
    // An end time before the start time is read as an overnight session
    this.durationError = toast(page, 'Session duration cannot exceed 12 hours')
    this.deletedToast = toast(page, 'Session deleted successfully')
    this.deletedFutureToast = toast(page, 'Session and all future occurrences deleted')
  }

  // session: { date, staff, client, serviceType, modality, start, end }; date comes from daysFromToday()
  async fill({ date, staff, client, serviceType, modality, start, end }) {
    await this.setDate(date)
    if (staff) await this.selectStaff(staff)
    if (client) await this.selectClient(client.fullName)
    await this.serviceTypeDropdown.click()
    await this.page.getByRole('button', { name: serviceType, exact: true }).click()
    await this.modalityDropdown.click()
    await this.page.getByRole('button', { name: modality, exact: true }).click()
    await this.setTimes(start, end)
  }

  async setDate(date) {
    await this.dateInput.fill(date.input)
    await this.page.keyboard.press('Escape')
  }

  async setTimes(start, end) {
    await this.startTimeInput.fill(start)
    await this.endTimeInput.fill(end)
  }

  // Options read "<name> <name>" (avatar label + text)
  async selectStaff(fullName) {
    await this.staffDropdown.click()
    await this.staffSearch.fill(fullName)
    await this.page.getByRole('button', { name: `${fullName} ${fullName}`, exact: true }).first().click()
    await this.page.keyboard.press('Escape')
  }

  // Client picker allows several clients and stays open, so close it after picking
  async selectClient(fullName) {
    await this.clientDropdown.click()
    await this.clientSearch.fill(fullName)
    await this.page.getByRole('button', { name: new RegExp(`${fullName}$`) }).first().click()
    await this.page.keyboard.press('Escape')
  }

  // Repeats every day from the session date until `endDate`. The series stops before the
  // "Ends on" day, so pass the day after the last occurrence. A bounded custom rule, so
  // tests never leave an endless series on production.
  async repeatDailyUntil(endDate) {
    await this.repeatsDropdown.click()
    await this.page.getByRole('button', { name: 'custom', exact: true }).click()
    await expect(this.recurrenceDialog.getByRole('button', { name: 'Day(s)' })).toBeVisible()
    await this.recurrenceDialog.locator('#ends-on').check()
    await this.recurrenceDialog.getByRole('textbox').last().fill(endDate.input)
    // Close the date picker without closing the dialog
    await this.recurrenceDialog.getByText('Custom Recurrence').click()
    await this.recurrenceDialog.getByRole('button', { name: 'Done' }).click()
    await expect(this.recurrenceDialog).toBeHidden()
  }

  async create() {
    await this.createButton.click()
    await expect(this.page).not.toHaveURL(/create-session/, { timeout: 20_000 })
  }

  async expectNotCreated(error) {
    await expect(error).toBeVisible()
    await expect(this.page).toHaveURL('/app/create-session')
  }

  // Opened from the Sessions list so that "go back" after saving lands there
  async openEdit(sessionId) {
    await this.page.goto('/app/sessions')
    await this.page.goto(`/app/edit-session/${sessionId}`)
    await this.expectEditLoaded()
  }

  async expectEditLoaded() {
    await expect(this.editHeading).toBeVisible()
    await expect(this.startTimeInput).not.toHaveValue('')
  }

  async update({ start, end }) {
    await this.setTimes(start, end)
    await this.updateButton.click()
    await expect(this.page).not.toHaveURL(/edit-session/, { timeout: 20_000 })
  }

  async chooseAction(action) {
    await this.actionsButton.click()
    await this.actionsMenu.getByText(action, { exact: true }).click()
  }

  async openCancelDialog() {
    await this.chooseAction('Cancel Session')
    await expect(this.cancelDialog).toBeVisible()
  }

  // scope is only asked for recurring sessions: 'this' | 'future'
  async cancelSession(reason, scope) {
    await this.openCancelDialog()
    await this.cancelReasonDropdown.click()
    await this.cancelDialog.getByRole('button', { name: reason, exact: true }).click()
    await this.confirmCancelButton.click()
    if (scope) await this.confirmRecurringScope('Cancel recurring session', scope, 'Cancel Session')
    await expect(this.page).not.toHaveURL(/edit-session/, { timeout: 20_000 })
  }

  async openDeleteDialog() {
    await this.chooseAction('Delete Session')
    await expect(this.deleteDialog).toBeVisible()
  }

  // scope is only asked for recurring sessions: 'this' | 'future'
  async deleteSession(scope) {
    await this.openDeleteDialog()
    await this.confirmDeleteButton.click()
    if (scope) await this.confirmRecurringScope('Delete recurring session', scope, 'Delete')
    await expect(scope === 'future' ? this.deletedFutureToast : this.deletedToast).toBeVisible()
  }

  // Dismisses whichever confirmation dialog is open without doing anything
  async dismissDialog(dialog) {
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(dialog).toBeHidden()
  }

  // Second dialog shown for a recurring session: "This session repeats. Which sessions do you want to ...?"
  async confirmRecurringScope(title, scope, action) {
    const dialog = this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: title }) })
    await dialog.getByText(SCOPE_LABELS[scope], { exact: true }).click()
    await dialog.getByRole('button', { name: action, exact: true }).click()
  }
}
