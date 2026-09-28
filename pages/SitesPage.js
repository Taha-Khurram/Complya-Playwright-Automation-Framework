import { expect } from '@playwright/test'
import { Sidebar } from './components/Sidebar'

export class SitesPage {

  constructor(page) {
    this.page = page
    this.sidebar = new Sidebar(page)
    this.sitesCard = page.locator("//div[contains(@class, 'card-body') and .//h5[text()='Sites']]")
    this.addButton = page.getByRole('button', { name: "Add" })
    // e.g. "1-10 / 10 Sites", shown once the list has loaded
    this.listSummary = page.getByRole('main').getByRole('heading', { name: /\/ \d+ Sites$/ })
    this.autofillButton = page.getByRole('button', { name: "Autofill from Workspace" })
    this.siteNameInput = page.getByRole('textbox', { name: 'Site Name *' })
    this.cityInput = page.getByRole('textbox', { name: 'City *' })
    this.zipInput = page.getByRole('textbox', { name: 'ZIP Code *' })
    this.stateInput = page.getByRole('textbox', { name: 'State *' })
    this.saveButton = page.getByRole('button', { name: 'Save' })
    this.successToast = page.locator("//div[text()='Site Created Successfully!']")
  }

  async visit() {
    await this.page.goto("/app/sites")
  }

  async open() {
    await this.sidebar.goToSettings()
    await expect(this.page).toHaveURL("/app/settings")
    await this.sitesCard.click()
    await expect(this.page).toHaveURL("/app/sites")
  }

  async createSite({ name, city, zip, state }) {
    await this.addButton.click()
    await this.autofillButton.click()
    // Wait for autofill to finish so it doesn't overwrite our values
    await this.page.waitForTimeout(5000)
    await this.siteNameInput.fill(name)
    await this.cityInput.fill(city)
    await this.zipInput.fill(zip)
    await this.stateInput.fill(state)
    await this.saveButton.click()
    await expect(this.successToast).toBeVisible()
  }
}
