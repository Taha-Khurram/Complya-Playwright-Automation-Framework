import { expect } from '@playwright/test'
import { toast } from './components/Toast'

// Settings > Sites at /app/sites
export class SitesPage {

  constructor(page) {
    this.page = page
    this.addButton = page.getByRole('main').getByRole('button', { name: 'Add', exact: true })
    this.autofillButton = page.getByRole('button', { name: 'Autofill from Workspace' })
    this.siteNameInput = page.getByRole('textbox', { name: 'Site Name *' })
    this.npiInput = page.locator('input[name="npi"]')
    this.cityInput = page.getByRole('textbox', { name: 'City *' })
    this.zipInput = page.getByRole('textbox', { name: 'ZIP Code *' })
    this.stateInput = page.getByRole('textbox', { name: 'State *' })
    this.saveButton = page.getByRole('button', { name: 'Save' })
    this.successToast = toast(page, 'Site Created Successfully!')

    this.requiredErrors = ['Site Name is required', 'City is required', 'ZIP is required', 'State is required']
      .map(text => page.getByText(text, { exact: true }))
  }

  async visit() {
    await this.page.goto('/app/sites')
    await expect(this.addButton).toBeVisible()
  }

  async openNewSiteForm() {
    await this.addButton.click()
    await expect(this.saveButton).toBeVisible()
  }

  async createSite({ name, city, zip, state }) {
    await this.openNewSiteForm()
    // Autofill copies NPI, EIN, phone and address from the workspace; wait for it so it can't overwrite our values
    await this.autofillButton.click()
    await expect(this.npiInput).not.toHaveValue('')
    await this.siteNameInput.fill(name)
    await this.cityInput.fill(city)
    await this.zipInput.fill(zip)
    await this.stateInput.fill(state)
    await this.saveButton.click()
    await expect(this.successToast).toBeVisible()
  }
}
