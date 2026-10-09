import { expect } from '@playwright/test'
import { toast } from './components/Toast'
import { Sidebar } from './components/Sidebar'

// Client list at /app/clients (sidebar > Clients) and its "Add" dialog
export class ClientsPage {

  constructor(page) {
    this.page = page
    this.sidebar = new Sidebar(page)
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

  async open() {
    await this.sidebar.goToClients()
    await expect(this.page).toHaveURL('/app/clients')
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

  // client: { firstName, lastName, dateOfBirth, site, gender }; dateOfBirth is relative to
  // today, e.g. { monthsAgo: 1, day: 15 }. Afterwards the app may open the new client's profile.
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
    await expect(this.dialog).toBeHidden()
  }

  async search(text) {
    await this.searchToggle.click()
    await this.searchInput.fill(text)
  }

  // Search matches loosely and shows names with extra spaces, so find the row by the
  // client's last name, which tests make unique
  clientRow({ lastName }) {
    return this.rows.filter({ hasText: lastName })
  }

  // Clients list -> search -> click the client, which opens their profile
  async openClient(client) {
    await this.open()
    await this.search(client.lastName)
    const row = this.clientRow(client)
    await expect(row).toHaveCount(1)
    await row.getByRole('img', { name: 'image' }).click()
    await expect(this.page).toHaveURL(/\/app\/client-tabs\//)
  }
}
