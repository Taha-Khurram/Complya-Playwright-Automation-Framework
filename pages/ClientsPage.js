import { expect } from '@playwright/test'
import { Sidebar } from './components/Sidebar'

export class ClientsPage {

  constructor(page) {
    this.page = page
    this.sidebar = new Sidebar(page)
    this.addButton = page.getByRole('button', { name: "Add" })
    this.firstNameInput = page.locator("#firstName")
    this.lastNameInput = page.locator("#lastName")
    this.dateOfBirthInput = page.locator("//input[@placeholder='Select date of birth']")
    this.siteDropdown = page.getByRole('button', { name: 'Select', exact: true })
    this.genderDropdown = page.getByRole('button', { name: 'Select Gender' })
    this.addClientButton = page.getByRole('button', { name: 'Add Client' })
    this.successToast = page.locator("//div[text()='Client has been added successfully!']")
  }

  async open() {
    await this.sidebar.goToClients()
    await expect(this.page).toHaveURL("/app/clients")
  }

  // dateOfBirth is the date picker's aria-label, e.g. 'Choose Wednesday, September 23rd, 2026'
  async createClient({ firstName, lastName, dateOfBirth, site, gender }) {
    await this.addButton.click()
    await this.page.waitForTimeout(5000)
    await this.firstNameInput.fill(firstName)
    await this.lastNameInput.fill(lastName)
    await this.dateOfBirthInput.click()
    await this.page.locator(`//div[@aria-label='${dateOfBirth}']`).click()
    await this.siteDropdown.click()
    await this.page.getByRole('button', { name: `${site} ${site}` }).first().click()
    await this.genderDropdown.click()
    await this.page.getByRole('button', { name: gender, exact: true }).click()
    await this.addClientButton.click()
    await expect(this.successToast).toBeVisible()
  }
}
