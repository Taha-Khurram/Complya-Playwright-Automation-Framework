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

  // dateOfBirth is relative to today, e.g. { monthsAgo: 1, day: 15 }. Returns the new client's id.
  // The id comes from the create response: the client list can't be used to find a client,
  // because its search matches loosely and long names are cut short.
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

    const created = this.page.waitForResponse(res =>
      res.request().method() === 'POST' && /\/api\/clients\/?$/.test(new URL(res.url()).pathname))
    await this.addClientButton.click()
    const response = await created
    expect(response.ok(), `Creating the client returned ${response.status()}`).toBe(true)
    await expect(this.successToast).toBeVisible()

    const id = findId(await response.json())
    expect(id, 'The create client response should include the new client\'s id').toBeTruthy()
    return id
  }
}

// First "id" in the response, nearest the top, e.g. { id } or { data: { id } }
function findId(body) {
  const queue = [body]
  while (queue.length) {
    const value = queue.shift()
    if (value && typeof value === 'object') {
      if (typeof value.id === 'string' || typeof value.id === 'number') return String(value.id)
      queue.push(...Object.values(value))
    }
  }
  return undefined
}
