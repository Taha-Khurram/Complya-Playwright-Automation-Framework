import { test, expect } from '../../fixtures'
import { client as clientDefaults, existingAccount, goal as goalDefaults, goalSessionType, session as sessionDefaults } from '../../test-data/testData'
import { daysFromToday } from '../../utils/dates'
import { uniqueName } from '../../utils/unique'

// Runs as the existing account from ADMIN_EMAIL / ADMIN_PASSWORD (signed in by
// tests/setup/existing-admin.setup.js); no new admin is signed up.
test.describe('Session note', () => {

  // Waits on the AI summary as well as several saves
  test.describe.configure({ timeout: 240_000 })

  test('Positive: staff runs a session, attempts goals, writes an AI note, signs it, and the note is saved', async ({
    existingAdmin, clientsPage, clientProfilePage, goalFormPage, sessionFormPage, sessionDetailPage,
    goalAttemptPage, sessionNotePage,
  }) => {
    // Goals only show in sessions whose service type tracks them (1:1, High Intensity, Group Therapy),
    // and only for clients that have goals. A new client keeps the test away from real clients' data.
    const client = { ...clientDefaults, lastName: uniqueName(), site: existingAccount.site }
    const goal = { ...goalDefaults, name: `${goalDefaults.name} ${uniqueName()}` }
    const session = { date: daysFromToday(0) }
    const goalResult = { name: goal.name, result: '50% correct' }
    let note

    await test.step('Set up a client with a goal', async () => {
      await clientsPage.open()
      await clientsPage.createClient(client)
      await clientProfilePage.openPrograms(client)
      await clientProfilePage.addNewGoal()
      await goalFormPage.createGoal(goal)
    })

    await test.step('Create a session from the client\'s Sessions tab with the + button', async () => {
      await clientProfilePage.openSessions(client)
      await clientProfilePage.openCreateSession()
      // The form starts on today, from now until an hour from now
      Object.assign(session, await sessionFormPage.createFromClientProfile({
        staff: existingAdmin.fullName, serviceType: goalSessionType, modality: sessionDefaults.modality,
      }))
    })

    await test.step('Find the session in the list and open it', async () => {
      await clientProfilePage.openSessions(client)
      await clientProfilePage.expectSessionStatus(session, 'Not Started')
      await clientProfilePage.openSession(session)
      await sessionDetailPage.expectDetails({ status: 'Not Started', serviceType: '1:1' })
    })

    await test.step('Start the session', async () => {
      await sessionDetailPage.startSession()
    })

    await test.step('Attempt the goal: one correct and one incorrect trial', async () => {
      await goalAttemptPage.openGoal(goal.name)
      await goalAttemptPage.answerTrial(1, 'Yes')
      await goalAttemptPage.answerTrial(2, 'No')
      await goalAttemptPage.expectPercentCorrect('50% (1/2)')
      await goalAttemptPage.closeGoal()
      await goalAttemptPage.expectGoalStarted(goal.name)
    })

    await test.step('Continue, generate the note with AI and insert it', async () => {
      await sessionNotePage.continueToNoteSummary()
      note = await sessionNotePage.generateAndInsertSummary()
    })

    await test.step('Continue: the summary shows the note and the goal attempts', async () => {
      await sessionNotePage.continueToSummary()
      await sessionNotePage.expectSummary({ note, goals: [goalResult] })
    })

    await test.step('Sign and submit (an empty signature cannot be submitted)', async () => {
      await sessionNotePage.signAndSubmit()
    })

    await test.step('Signing ended the session and sent it for review', async () => {
      await clientProfilePage.openSessionDetails(client, session)
      await sessionDetailPage.expectDetails({ status: 'In Review' })
      await expect(sessionDetailPage.submittedForReview).toBeVisible()
      await sessionDetailPage.expectSessionEnded()
    })

    await test.step('The note opened from the session details has everything saved', async () => {
      await sessionDetailPage.openNote()
      await sessionNotePage.expectSummary({ note, goals: [goalResult] })
      await sessionNotePage.expectSigned(existingAdmin.fullName)
    })
  })
})
