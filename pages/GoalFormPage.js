import { expect } from '@playwright/test'
import { toast } from './components/Toast'

// "Add Goal" at /app/create-goal, opened from a client's Programs tab.
// The form saves a draft as fields are filled; Publish validates every section and makes
// the goal active. If a section is invalid, Publish switches to that section's tab instead.
export class GoalFormPage {

  constructor(page) {
    this.page = page
    this.main = page.getByRole('main')
    // Rich text editor of whichever section is open
    this.editor = this.main.locator('.tiptap').first()

    // Details section
    this.nameInput = this.main.getByRole('textbox', { name: 'e.g. Receptive vocabulary' })
    this.categoryDropdown = this.main.getByRole('button', { name: 'Select Category' })
    this.descriptionButton = this.main.getByRole('button', { name: /Add Description/ })
    this.closePanelButton = this.main.getByRole('button', { name: 'Close' })

    // RBT Instructions section
    this.instructionsTab = this.main.getByRole('button', { name: 'RBT Instructions RBT Instructions' })

    // Goals section. Trials starts with one target, named by clicking its placeholder name.
    this.goalsTab = this.main.getByRole('button', { name: 'Goals Goals' })
    this.methodDropdown = this.main.getByRole('button', { name: 'Data Collection Method' })
    this.targetName = this.main.locator('.goal-step-name-span').first()
    // Baseline %, mastery %, trials per session, sessions in a row, maintenance %, maintenance trials
    this.criteriaInputs = this.main.locator('.step-mastery-criteria').getByRole('spinbutton')
    this.maintenancePeriodDropdown = this.main.getByRole('button', { name: 'Select Frequency' })

    this.publishButton = this.main.getByRole('button', { name: 'Publish' })
    // The first autosave creates the goal, so Publish may report either
    this.savedToast = toast(page, /Goal (created|updated) successfully!/)

    this.requiredErrors = ['Goal Name is required', 'Goal Category is required', 'Goal Description is required']
      .map(text => this.main.getByText(text, { exact: true }))
  }

  // goal: see `goal` in test-data/testData.js
  async createGoal({ name, category, description, instructions, method, target, mastery, maintenance }) {
    await this.nameInput.fill(name)
    await this.categoryDropdown.click()
    await this.page.getByRole('button', { name: category, exact: true }).click()
    await this.descriptionButton.click()
    await this.editor.click()
    await this.page.keyboard.type(description)
    await this.closePanelButton.click()

    await this.instructionsTab.click()
    await this.editor.click()
    await this.page.keyboard.type(instructions)

    await this.goalsTab.click()
    await this.methodDropdown.click()
    await this.page.getByRole('button', { name: method, exact: true }).click()
    await this.targetName.click()
    await this.page.keyboard.type(target)
    await this.page.keyboard.press('Enter')
    await expect(this.targetName).toHaveText(target)

    const criteria = [mastery.percentCorrect, mastery.trialsPerSession, mastery.sessionsInARow, maintenance.percentCorrect, maintenance.trialsPerSession]
    for (const [i, value] of criteria.entries()) await this.criteriaInputs.nth(i + 1).fill(String(value))
    // Autosave is debounced and sends the whole goal. Let the save that carries the last
    // edit finish first, or it lands after Publish and turns the goal back into a draft.
    const lastDraftSave = this.waitForGoalSave(body => body.isDraft === true &&
      body.targets?.[0]?.masteryCriteria?.maintenanceFrequency === maintenance.period.toLowerCase())
    await this.maintenancePeriodDropdown.click()
    await this.page.getByRole('button', { name: maintenance.period, exact: true }).click()
    await lastDraftSave

    // Autosave shows the same toast, so wait for the publish request itself
    const published = this.waitForGoalSave(body => body.isDraft === false)
    await this.publishButton.click()
    await published
    await expect(this.savedToast).toBeVisible()
  }

  // Resolves with the first successful goal create/update whose JSON body matches
  async waitForGoalSave(matches) {
    const res = await this.page.waitForResponse(res =>
      res.url().includes('/api/goals') && res.request().method() !== 'GET' && matches(requestBody(res.request())))
    expect(res.ok()).toBe(true)
    return res
  }
}

function requestBody(request) {
  try {
    return request.postDataJSON() ?? {}
  } catch {
    return {}
  }
}
