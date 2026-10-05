import { expect } from '@playwright/test'

export class Sidebar {

  constructor(page) {
    this.page = page
    this.wrapper = page.locator("//div[contains(@class, 'sidebar-main-wrapper')]")
    this.links = this.wrapper.getByRole('link')
    this.settingsLink = page.getByRole('link', { name: 'Settings icon Settings' })
    this.clientsLink = page.getByRole('link', { name: 'Client Icon Clients' })
    this.staffLink = page.getByRole('link', { name: 'Staff icon Staff' })
  }

  // The sidebar is collapsed until hovered. A hover before the page has settled can be missed,
  // so keep hovering until the links show their labels (collapsed links have no name)
  async expand() {
    await expect(async () => {
      await this.wrapper.hover()
      await expect(this.wrapper.getByRole('link', { name: /\S/ }).first()).toBeVisible({ timeout: 1_000 })
    }).toPass({ timeout: 15_000 })
  }

  async open(link) {
    await this.expand()
    await link.click()
  }

  async goToSettings() {
    await this.open(this.settingsLink)
  }

  async goToClients() {
    await this.open(this.clientsLink)
  }

  async goToStaff() {
    await this.open(this.staffLink)
  }
}
