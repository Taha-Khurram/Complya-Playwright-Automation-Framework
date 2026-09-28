import { expect } from '@playwright/test'

// Shown when a user opens a page they don't have access to
export class NotFoundPage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Page not found' })
  }

  async expectShown() {
    await expect(this.page).toHaveURL('/app/404')
    await expect(this.heading).toBeVisible()
  }
}
