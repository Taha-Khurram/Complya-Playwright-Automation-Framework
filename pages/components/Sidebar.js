export class Sidebar {

  constructor(page) {
    this.page = page
    this.wrapper = page.locator("//div[contains(@class, 'sidebar-main-wrapper')]")
    this.settingsLink = page.getByRole('link', { name: 'Settings icon Settings' })
    this.clientsLink = page.getByRole('link', { name: 'Client Icon Clients' })
    this.staffLink = page.getByRole('link', { name: 'Staff icon Staff' })
  }

  // The sidebar is collapsed until hovered
  async expand() {
    await this.wrapper.hover()
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
