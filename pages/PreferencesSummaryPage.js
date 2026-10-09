import { expect } from '@playwright/test'

// The "Preferences" dialog on a session's note screen: the "About this client" icon in the
// header opens it, and it straight away asks AI to summarize the client's Preferences tab.
// Its footer has "Regenerate with prompt", which takes a custom prompt and generates again.
export class PreferencesSummaryPage {

  constructor(page) {
    this.page = page
    this.aboutClientButton = page.getByRole('button', { name: 'About this client' })
    this.dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Preferences', exact: true }) })
    this.summary = this.dialog.locator('.ai-response-text')
    this.regenerateWithPromptButton = this.dialog.getByRole('button', { name: 'Regenerate with prompt' })
    this.promptInput = this.dialog.getByPlaceholder('Add custom prompt for regeneration...')
    this.generateButton = this.dialog.getByRole('button', { name: 'Generate', exact: true })
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' })

    // Shown instead of a summary when the Preferences tab is empty
    this.noSummaryHeading = this.dialog.getByRole('heading', { name: 'No summary available' })
    this.noSummaryHint = this.dialog.getByText("Make sure the client's Preferences tab has content, then regenerate.")
  }

  // Resolves once AI has answered (successfully or not)
  waitForGeneration() {
    return this.page.waitForResponse(r =>
      r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/assist/about-me'), { timeout: 90_000 })
  }

  async open() {
    const generated = this.waitForGeneration()
    await this.aboutClientButton.click()
    await expect(this.dialog).toBeVisible()
    await generated
  }

  // Opens the dialog and returns the generated summary
  async generate() {
    await this.open()
    return this.readSummary()
  }

  // Asks AI to write the summary again following `prompt`, and returns the new summary
  async regenerateWithPrompt(prompt) {
    await this.regenerateWithPromptButton.click()
    await this.promptInput.fill(prompt)
    const generated = this.waitForGeneration()
    await this.generateButton.click()
    expect((await generated).ok(), 'Regenerating the summary should succeed').toBe(true)
    // The prompt form closes once the new summary is in
    await expect(this.promptInput).toBeHidden()
    await expect(this.regenerateWithPromptButton).toBeEnabled()
    return this.readSummary()
  }

  async readSummary() {
    await expect(this.summary).toBeVisible()
    const text = (await this.summary.innerText()).trim()
    expect(text, 'AI should generate a preferences summary').not.toBe('')
    return text
  }

  async expectNoSummary() {
    await expect(this.noSummaryHeading).toBeVisible()
    await expect(this.noSummaryHint).toBeVisible()
    await expect(this.summary).toBeHidden()
  }

  async close() {
    await this.closeButton.click()
    await expect(this.dialog).toBeHidden()
  }
}
