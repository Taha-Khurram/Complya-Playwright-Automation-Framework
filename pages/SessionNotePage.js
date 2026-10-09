import { expect } from '@playwright/test'
import { toast } from './components/Toast'

// The session note after the Goals step, on the same /app/goal-attempt page:
//   Goals -> Note Summary (write the note, with AI) -> Summary (review) -> Sign.
// Opening a submitted note ("View Note") shows the same Summary, read-only.
export class SessionNotePage {

  constructor(page) {
    this.page = page
    this.continueButton = page.getByRole('button', { name: 'Continue' })

    // Note Summary step
    this.editor = page.locator('.tiptap').first()
    this.generateSummaryButton = page.getByRole('button', { name: 'AI Generate Summary' })
    this.aiDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'AI Assistant' }) })
    this.generatedNote = this.aiDialog.getByRole('paragraph')
    this.insertButton = this.aiDialog.getByRole('button', { name: 'Insert' })

    // Summary step. The page has an outer <main> and the note's own <main> inside it.
    this.summary = page.getByRole('main').getByRole('main')
    this.goalsCompleted = this.summary.getByRole('button', { name: /^\d+\/\d+ goals completed$/ })
    this.signButton = page.getByRole('button', { name: 'Sign', exact: true })
    this.signatureDialog = page.getByRole('dialog').filter({ hasText: 'Signature' })
    this.signatureCanvas = this.signatureDialog.locator('canvas')
    this.submitSignatureButton = this.signatureDialog.getByRole('button', { name: 'Submit' })
    this.submittedToast = toast(page, 'Draft published successfully.')
  }

  // From the Goals step
  async continueToNoteSummary() {
    await this.continueButton.click()
    await expect(this.generateSummaryButton).toBeVisible()
  }

  // Generates the note with AI and inserts it. Returns the generated paragraphs.
  async generateAndInsertSummary() {
    await this.generateSummaryButton.click()
    // The AI answer usually takes a few seconds
    await expect(this.insertButton).toBeVisible({ timeout: 60_000 })
    const note = (await this.generatedNote.allInnerTexts()).map(p => p.trim()).filter(Boolean)
    expect(note.length, 'AI should generate a note').toBeGreaterThan(0)
    await this.insertButton.click()
    await expect(this.aiDialog).toBeHidden()
    for (const paragraph of note) await expect(this.editor).toContainText(paragraph)
    return note
  }

  async continueToSummary() {
    await this.continueButton.click()
    await expect(this.signButton).toBeVisible()
  }

  // note: paragraphs from generateAndInsertSummary(); goal: { name, result } e.g. result "50% correct"
  async expectSummary({ note, goals }) {
    for (const paragraph of note) await expect(this.summary.getByText(paragraph, { exact: true })).toBeVisible()
    await expect(this.goalsCompleted).toHaveText(`${goals.length}/${goals.length} goals completed`)
    // Reads e.g. "Playwright Goal X ✓ 50% correct Trials"; the parts are separate elements
    for (const { name, result } of goals) {
      await expect(this.summary).toContainText(new RegExp(`${escapeRegExp(name)}\\s*✓\\s*${escapeRegExp(result)}`))
    }
  }

  // Submit stays disabled until something is drawn
  async signAndSubmit() {
    await this.signButton.click()
    await expect(this.signatureDialog).toBeVisible()
    await expect(this.submitSignatureButton, 'An empty signature cannot be submitted').toBeDisabled()
    await this.drawSignature()
    await expect(this.submitSignatureButton).toBeEnabled()
    await this.submitSignatureButton.click()
    await expect(this.submittedToast).toBeVisible()
  }

  async drawSignature() {
    const box = await this.signatureCanvas.boundingBox()
    await this.page.mouse.move(box.x + 60, box.y + 120)
    await this.page.mouse.down()
    for (const [x, y] of [[120, 60], [200, 120], [280, 50], [360, 130], [440, 70]]) {
      await this.page.mouse.move(box.x + x, box.y + y, { steps: 8 })
    }
    await this.page.mouse.up()
  }

  // A signed note shows "✓ Signature <date>" and "Signed by <name>"
  async expectSigned(staffName) {
    await expect(this.summary.getByRole('button', { name: /^✓ Signature / })).toBeVisible()
    await expect(this.summary.getByText(`Signed by ${staffName}`)).toBeVisible()
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
