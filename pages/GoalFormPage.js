import { expect } from '@playwright/test'
import { toast } from './components/Toast'

// "Add Goal" at /app/create-goal, opened from a client's Programs tab.
// The form saves a draft as fields are filled; Publish makes the goal active.
export class GoalFormPage {

  constructor(page) {
    this.page = page
    this.main = page.getByRole('main')

    // Details section
    this.nameInput = this.main.getByRole('textbox', { name: 'e.g. Receptive vocabulary' })
    this.categoryDropdown = this.main.getByRole('button', { name: 'Select Category' })
    this.descriptionButton = this.main.getByRole('button', { name: /Add Description/ })
    this.descriptionEditor = this.main.locator('.tiptap').first()
    this.closePanelButton = this.main.getByRole('button', { name: 'Close' })

    // Goals section
    this.goalsTab = this.main.getByRole('button', { name: 'Goals Goals' })
    this.methodDropdown = this.main.getByRole('button', { name: 'Data Collection Method' })
    this.addTargetButton = this.main.getByRole('button', { name: '+ Add Target' })

    this.publishButton = this.main.getByRole('button', { name: 'Publish' })
    // The first autosave creates the goal, so Publish may report either
    this.savedToast = toast(page, /Goal (created|updated) successfully!/)

    this.requiredErrors = ['Goal Name is required', 'Goal Category is required', 'Goal Description is required']
      .map(text => this.main.getByText(text, { exact: true }))
  }

  // goal: { name, category, description, method }; Trials, Task Analysis etc. need a target, so one is added
  async createGoal({ name, category, description, method }) {
    await this.nameInput.fill(name)
    await this.categoryDropdown.click()
    await this.page.getByRole('button', { name: category, exact: true }).click()

    await this.descriptionButton.click()
    await this.descriptionEditor.click()
    await this.page.keyboard.type(description)
    await this.closePanelButton.click()

    await this.goalsTab.click()
    await this.methodDropdown.click()
    await this.page.getByRole('button', { name: method, exact: true }).click()
    await this.addTargetButton.click()

    await this.publishButton.click()
    await expect(this.savedToast).toBeVisible()
  }
}
