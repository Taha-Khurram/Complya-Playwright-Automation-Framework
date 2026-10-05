import { expect } from '@playwright/test'
import { Sidebar } from './components/Sidebar'

export class ClientsPage {

  constructor(page) {
    this.page = page
    this.sidebar = new Sidebar(page)
    this.addButton = page.getByRole('button', { name: "Add" })
    // e.g. "1-10 / 13 Clients", shown once the list has loaded
    this.listSummary = page.getByRole('main').getByRole('heading', { name: /\/ \d+ Clients$/ })
    this.firstNameInput = page.locator("#firstName")
    this.lastNameInput = page.locator("#lastName")
    this.dateOfBirthInput = page.locator("//input[@placeholder='Select date of birth']")
    this.previousMonthButton = page.getByRole('button', { name: 'Previous Month' })
    // Days of the month on screen, e.g. listbox "Month October, 2026"
    this.calendarMonth = page.getByRole('listbox', { name: /^Month / })
    this.siteDropdown = page.getByRole('button', { name: 'Select', exact: true })
    this.genderDropdown = page.getByRole('button', { name: 'Select Gender' })
    this.addClientButton = page.getByRole('button', { name: 'Add Client' })
    this.successToast = page.locator("//div[text()='Client has been added successfully!']")
  }

  async visit() {
    await this.page.goto("/app/clients")
  }

  async open() {
    await this.sidebar.goToClients()
    await expect(this.page).toHaveURL("/app/clients")
  }

  // The picker opens on the current month and disables future days, so pick relative to today:
  // go back `monthsAgo` months, then click `day` (e.g. 15th, which never shows as a neighbouring month's day)
  async pickDateOfBirth({ monthsAgo, day }) {
    await this.dateOfBirthInput.click()
    for (let i = 0; i < monthsAgo; i++) await this.previousMonthButton.click()
    await this.calendarMonth.getByRole('option', { name: new RegExp(`^Choose \\w+, \\w+ ${day}(st|nd|rd|th), \\d{4}$`) }).click()
  }

  // dateOfBirth is relative to today, e.g. { monthsAgo: 1, day: 15 }
  async createClient({ firstName, lastName, dateOfBirth, site, gender }) {
    await this.addButton.click()
    await this.page.waitForTimeout(5000)
    await this.firstNameInput.fill(firstName)
    await this.lastNameInput.fill(lastName)
    await this.pickDateOfBirth(dateOfBirth)
    await this.siteDropdown.click()
    await this.page.getByRole('button', { name: `${site} ${site}` }).first().click()
    await this.genderDropdown.click()
    await this.page.getByRole('button', { name: gender, exact: true }).click()
    await this.addClientButton.click()
    await expect(this.successToast).toBeVisible()
  }
}
