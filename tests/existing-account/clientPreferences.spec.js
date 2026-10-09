import { test, expect } from '../../fixtures'
import { ClientsPage } from '../../pages/ClientsPage'
import { client as clientDefaults, existingAccount, goalSessionType, preferences, session as sessionDefaults } from '../../test-data/testData'
import { EXISTING_ADMIN_STATE } from '../../utils/auth'
import { daysFromToday } from '../../utils/dates'
import { uniqueName } from '../../utils/unique'

// Runs as the existing account from ADMIN_EMAIL / ADMIN_PASSWORD (signed in by
// tests/setup/existing-admin.setup.js). The cases build on each other in order, all on one
// client made for this run: its preferences are added, summarized in a session, edited,
// removed and added again. The session started by the second case is reused by the rest.
test.describe('Client preferences', () => {

  // Waits on autosaves and AI summaries
  test.describe.configure({ mode: 'serial', timeout: 240_000 })

  const client = { ...clientDefaults, lastName: uniqueName(), site: existingAccount.site }
  let session

  test.beforeAll(async ({ browser }, testInfo) => {
    const { baseURL, viewport } = testInfo.project.use
    const context = await browser.newContext({ baseURL, viewport, storageState: EXISTING_ADMIN_STATE })
    const clientsPage = new ClientsPage(await context.newPage())
    await clientsPage.open()
    await clientsPage.createClient(client)
    await context.close()
  })

  // Clients > client > Sessions tab > the session > Add Note. Ends on the session's note screen.
  async function openSession({ clientProfilePage, sessionDetailPage }) {
    await clientProfilePage.openSessionDetails(client, session)
    await sessionDetailPage.continueNote()
  }

  function expectMentions(summary, keywords) {
    for (const keyword of keywords) expect(summary, `Summary should mention ${keyword}`).toMatch(keyword)
  }

  function expectNoMention(summary, keywords) {
    for (const keyword of keywords) expect(summary, `Summary should not mention ${keyword}`).not.toMatch(keyword)
  }

  test('Positive: preferences typed into the Preferences tab are autosaved and still there after switching tabs', async ({
    clientProfilePage,
  }) => {
    await test.step('Write the preferences and wait for the green "Saved" label', async () => {
      await clientProfilePage.openPreferences(client)
      await clientProfilePage.writePreferences(preferences.text)
    })

    await test.step('Switch to another tab and back: the preferences were saved', async () => {
      await clientProfilePage.expectPreferencesKept(preferences.text)
    })
  })

  test('Positive: the preferences summary in a session is generated from the client\'s preferences', async ({
    existingAdmin, clientProfilePage, sessionFormPage, sessionDetailPage, preferencesSummaryPage,
  }) => {
    await test.step('Create a session for the client with the admin as staff, and start it', async () => {
      await clientProfilePage.openSessions(client)
      await clientProfilePage.openCreateSession()
      // The form starts on today, from now until an hour from now
      const times = await sessionFormPage.createFromClientProfile({
        staff: existingAdmin.fullName, serviceType: goalSessionType, modality: sessionDefaults.modality,
      })
      session = { date: daysFromToday(0), ...times }
      await clientProfilePage.openSessionDetails(client, session)
      await sessionDetailPage.startSession()
    })

    await test.step('Generate the preferences summary from the header: it reflects the preferences', async () => {
      const summary = await preferencesSummaryPage.generate()
      expectMentions(summary, preferences.keywords)
    })
  })

  test('Positive: after the preferences are edited, the summary is regenerated from the new preferences', async ({
    clientProfilePage, sessionDetailPage, preferencesSummaryPage,
  }) => {
    await test.step('Edit the client\'s preferences', async () => {
      await clientProfilePage.openPreferences(client)
      await clientProfilePage.writePreferences(preferences.edited.text)
      await clientProfilePage.expectPreferencesKept(preferences.edited.text)
    })

    await test.step('Go to the session and generate the summary: it follows the edited preferences', async () => {
      await openSession({ clientProfilePage, sessionDetailPage })
      const summary = await preferencesSummaryPage.generate()
      expectMentions(summary, preferences.edited.keywords)
      expectNoMention(summary, preferences.keywords)
    })
  })

  test('Negative: with the preferences removed, the summary says there is no summary available', async ({
    clientProfilePage, sessionDetailPage, preferencesSummaryPage,
  }) => {
    await test.step('Remove everything from the client\'s preferences', async () => {
      await clientProfilePage.openPreferences(client)
      await clientProfilePage.writePreferences('')
      await clientProfilePage.expectPreferencesKept('')
    })

    await test.step('Go to the session and generate the summary: "No summary available" asks for Preferences content', async () => {
      await openSession({ clientProfilePage, sessionDetailPage })
      await preferencesSummaryPage.open()
      await preferencesSummaryPage.expectNoSummary()
    })
  })

  test('Positive: "Regenerate with prompt" rewrites the preferences summary following the prompt', async ({
    clientProfilePage, sessionDetailPage, preferencesSummaryPage,
  }) => {
    let firstSummary

    await test.step('Add the preferences again', async () => {
      await clientProfilePage.openPreferences(client)
      await clientProfilePage.writePreferences(preferences.text)
    })

    await test.step('Go to the session and generate the summary', async () => {
      await openSession({ clientProfilePage, sessionDetailPage })
      firstSummary = await preferencesSummaryPage.generate()
      expectMentions(firstSummary, preferences.keywords)
    })

    await test.step('Regenerate with a prompt: the new summary follows the prompt', async () => {
      const summary = await preferencesSummaryPage.regenerateWithPrompt(preferences.prompt)
      expect(summary).not.toBe(firstSummary)
      expectMentions(summary, preferences.promptKeywords)
      expectNoMention(summary, preferences.promptExcludes)
    })
  })
})
