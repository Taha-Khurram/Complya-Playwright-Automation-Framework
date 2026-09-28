import { expect } from '@playwright/test'

// Settings at /app/settings, a grid of cards that each open a settings area
export class SettingsPage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('main').getByRole('heading', { name: 'Settings', exact: true })
    this.cardTitles = page.getByRole('main').getByRole('heading', { level: 5 })
  }

  async visit() {
    await this.page.goto('/app/settings')
  }

  // cards: card titles in order, e.g. ['Sites', 'Plans', ...]
  async expectCards(cards) {
    await expect(this.heading).toBeVisible()
    await expect(this.cardTitles).toHaveText(cards)
  }
}
