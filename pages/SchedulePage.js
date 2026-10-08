import { expect } from '@playwright/test'

// Schedule (calendar) at /app/calender, where sessions are added
export class SchedulePage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('main').getByRole('heading', { name: 'Schedule' })
    this.addButton = page.getByRole('main').getByRole('button', { name: 'Add', exact: true })
  }

  async visit() {
    await this.page.goto('/app/calender')
    await expect(this.heading).toBeVisible()
  }

  async addSession() {
    await this.addButton.click()
    await expect(this.page).toHaveURL('/app/create-session')
  }
}
