import { expect } from '@playwright/test'

// The menu on the left of every admin page. Page objects use it to get to their page by
// clicking, the way a user does.
//
// This is also the only place an admin test opens a URL: a new browser tab starts empty,
// so the first navigation loads the app's home page. Everything after that is clicks.
export class Sidebar {

  constructor(page) {
    this.page = page
    this.wrapper = page.locator('.sidebar-main-wrapper')
    this.links = this.wrapper.getByRole('link')
  }

  // A menu item by its label: 'Home', 'Clients', 'Staff', 'Schedule', 'Sessions', 'Settings', ...
  link(label) {
    return this.wrapper.getByRole('link', { name: label, exact: false })
  }

  // Opens the app if this tab isn't showing it yet
  async openApp() {
    if (new URL(this.page.url()).pathname.startsWith('/app/')) return
    await this.page.goto('/app/')
    // A full page load shows the app's "Complya . . ." boot screen first, which can be slow
    await expect(this.wrapper).toBeVisible({ timeout: 30_000 })
  }

  // The sidebar is collapsed until hovered. A hover before the page has settled can be missed,
  // so keep hovering until the links show their labels (collapsed links have no name)
  async expand() {
    await expect(async () => {
      await this.wrapper.hover()
      await expect(this.wrapper.getByRole('link', { name: /\S/ }).first()).toBeVisible({ timeout: 1_000 })
    }).toPass({ timeout: 15_000 })
  }

  async goTo(label) {
    await this.openApp()
    await this.expand()
    await this.link(label).click()
    // The sidebar stays open while hovered and would cover the page, so move the mouse off it
    const { width, height } = this.page.viewportSize()
    await this.page.mouse.move(width - 20, height / 2)
  }

  goToHome() { return this.goTo('Home') }
  goToClients() { return this.goTo('Clients') }
  goToStaff() { return this.goTo('Staff') }
  goToSchedule() { return this.goTo('Schedule') }
  goToSessions() { return this.goTo('Sessions') }
  goToSettings() { return this.goTo('Settings') }
}
