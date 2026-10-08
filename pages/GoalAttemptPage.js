import { expect } from '@playwright/test'

// Goal data collection for a session, at /app/goal-attempt?sessionId=...&clientId=...
// The app opens it from a session's "Add Note" for service types that track goals (1:1,
// High Intensity, Group Therapy). Each of the client's In Progress goals is a card.
export class GoalAttemptPage {

  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Goals', level: 5 })
    this.dialog = page.getByRole('dialog')
    // e.g. "% Correct: 50% (1/2)"
    this.percentCorrect = this.dialog.getByText(/^% Correct:/)
    this.saveDraftButton = page.getByRole('button', { name: 'Save as Draft' })
  }

  // Opened from the client's profile so that "go back" after saving lands there
  async open({ sessionId, clientId }) {
    await this.page.goto(`/app/client-tabs/${clientId}?tab=sessions`)
    await this.page.goto(`/app/goal-attempt?sessionId=${sessionId}&clientId=${clientId}`)
    await expect(this.heading).toBeVisible()
  }

  goalCard(name) {
    return this.page.getByRole('article').filter({ has: this.page.getByRole('heading', { name, exact: true }) })
  }

  async openGoal(name) {
    await this.goalCard(name).getByRole('button', { name: 'View' }).click()
    await expect(this.dialog).toBeVisible()
  }

  // trial is 1-based; answer: 'Yes' | 'No'. Clicking the chosen answer again clears it.
  async answerTrial(trial, answer) {
    await this.dialog.getByRole('button', { name: answer, exact: true }).nth(trial - 1).click()
  }

  async expectPercentCorrect(text) {
    await expect(this.percentCorrect).toHaveText(`% Correct: ${text}`)
  }

  async closeGoal() {
    await this.dialog.getByRole('button', { name: 'Close' }).click()
    await expect(this.dialog).toBeHidden()
  }

  // Card icon goes from "notStartedIcon" to "pendingSquareIcon" once a trial is answered
  async expectGoalStarted(name) {
    await expect(this.goalCard(name).getByRole('img', { name: 'pendingSquareIcon' })).toBeVisible()
  }

  async expectGoalNotStarted(name) {
    await expect(this.goalCard(name).getByRole('img', { name: 'notStartedIcon' })).toBeVisible()
  }

  // Saves the session note with its goal data; the app then returns to the previous page
  async saveDraft() {
    const saved = this.page.waitForResponse(res => res.url().includes('/api/notes') && res.request().method() !== 'GET')
    await this.saveDraftButton.click()
    expect((await saved).ok()).toBe(true)
  }
}
