import { expect } from '@playwright/test'
import { toast } from './components/Toast'

// Client list at /app/clients and its "Add" dialog
export class ClientsPage {

  constructor(page) {
    this.page = page
    this.main = page.getByRole('main')
    this.addButton = this.main.getByRole('button', { name: 'Add', exact: true })
    // e.g. "1-10 / 18 clients", shown once the list has loaded (case varies between views)
    this.listSummary = this.main.getByRole('heading', { name: /^\d+-\d+ \/ \d+ clients$/i })
    this.searchInput = this.main.getByRole('textbox', { name: 'Search...' })
    // The search box is collapsed until the icon button just before it is clicked
    this.searchToggle = this.searchInput.locator('xpath=preceding::button[1]')
    this.rows = this.main.getByRole('row')

    this.dialog = page.getByRole('dialog')
    this.firstNameInput = this.dialog.getByRole('textbox', { name: 'First Name', exact: true })
    this.lastNameInput = this.dialog.getByRole('textbox', { name: 'Last Name', exact: true })
    this.dateOfBirthInput = this.dialog.getByPlaceholder('Select date of birth')
    this.previousMonthButton = page.getByRole('button', { name: 'Previous Month' })
    // Days of the month on screen, e.g. listbox "Month October, 2026"
    this.calendarMonth = page.getByRole('listbox', { name: /^Month / })
    this.siteDropdown = this.dialog.getByRole('button', { name: 'Select', exact: true })
    this.genderDropdown = this.dialog.getByRole('button', { name: 'Select gender' })
    this.addClientButton = this.dialog.getByRole('button', { name: 'Add Client' })
    this.successToast = toast(page, 'Client has been added successfully!')

    this.requiredErrors = ['First name is required', 'Last name is required', 'Date of Birth is Required', 'Site is Required', 'Gender is Required']
      .map(text => this.dialog.getByText(text, { exact: true }))
  }

  async visit() {
    await this.page.goto('/app/clients')
    await expect(this.listSummary).toBeVisible()
  }

  async openNewClientForm() {
    await this.addButton.click()
    await expect(this.firstNameInput).toBeEditable()
  }

  // The picker opens on the current month and disables future days, so pick relative to today:
  // go back `monthsAgo` months, then click `day` (e.g. 15th, which never shows as a neighbouring month's day)
  async pickDateOfBirth({ monthsAgo, day }) {
    await this.dateOfBirthInput.click()
    for (let i = 0; i < monthsAgo; i++) await this.previousMonthButton.click()
    await this.calendarMonth.getByRole('option', { name: new RegExp(`^Choose \\w+, \\w+ ${day}(st|nd|rd|th), \\d{4}$`) }).click()
  }

  // dateOfBirth is relative to today, e.g. { monthsAgo: 1, day: 15 }.
  // Returns the new client's id, from their profile at /app/client-tabs/<id>
  async createClient({ firstName, lastName, dateOfBirth, site, gender }) {
    await this.openNewClientForm()
    await this.firstNameInput.fill(firstName)
    await this.lastNameInput.fill(lastName)
    await this.pickDateOfBirth(dateOfBirth)
    await this.siteDropdown.click()
    // Options read "<site> <site>" (icon label + text); several sites can share a name
    await this.page.getByRole('button', { name: `${site} ${site}` }).first().click()
    await this.genderDropdown.click()
    await this.page.getByRole('button', { name: gender, exact: true }).click()
    await this.addClientButton.click()
    await expect(this.successToast).toBeVisible()

    // Sometimes the app opens the new client's profile by itself, sometimes it stays on the list
    const profileUrl = /\/app\/client-tabs\/[^/?]+/
    const openedByApp = await this.page.waitForURL(profileUrl, { timeout: 5_000, waitUntil: 'commit' }).then(() => true, () => false)
    if (!openedByApp) {
      await this.search(`${firstName} ${lastName}`)
      const row = this.clientRow(`${firstName} ${lastName}`)
      await expect(row).toHaveCount(1)
      await row.getByRole('img', { name: 'image' }).click()
      await this.page.waitForURL(profileUrl, { waitUntil: 'commit' })
    }
    await expect(this.page.getByRole('main').getByText(`${firstName} ${lastName}`).first()).toBeVisible()
    return new URL(this.page.url()).pathname.split('/').pop()
  }

  async search(fullName) {
    await this.searchToggle.click()
    await this.searchInput.fill(fullName)
  }

  clientRow(fullName) {
    return this.rows.filter({ hasText: fullName })
  }
}
