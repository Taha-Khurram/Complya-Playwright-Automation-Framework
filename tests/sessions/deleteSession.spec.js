import { test } from '../../fixtures'

// Deleting moves a session to archived sessions, where an admin can restore it
test.describe('Delete session', () => {

  test.describe.configure({ timeout: 120_000 })

  test('Positive: admin deletes a single session and it leaves the client\'s schedule', async ({
    createSession, testClient, sessionFormPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 45 })

    await test.step('Delete the session', async () => {
      await sessionFormPage.openEdit(session.id)
      await sessionFormPage.deleteSession()
    })

    await test.step("Session is no longer on the client's list", async () => {
      await clientProfilePage.openSessions(testClient.id)
      await clientProfilePage.expectSessionNotListed(session)
    })
  })


  test('Negative: backing out of the delete confirmation keeps the session', async ({
    createSession, testClient, sessionFormPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 46 })

    await sessionFormPage.openEdit(session.id)
    await sessionFormPage.openDeleteDialog()
    await sessionFormPage.dismissDialog(sessionFormPage.deleteDialog)

    await clientProfilePage.openSessions(testClient.id)
    await clientProfilePage.expectSessionStatus(session, 'Upcoming')
  })


  test('Positive: deleting "this and all future" occurrences keeps earlier ones in the series', async ({
    createSession, testClient, sessionFormPage, clientProfilePage,
  }) => {
    const [first, second, third] = await test.step('Schedule a session that repeats daily for 3 days',
      () => createSession({ daysAhead: 50, repeatDays: 2 }))

    await test.step('Delete the second occurrence and all after it', async () => {
      await sessionFormPage.openEdit(second.id)
      await sessionFormPage.deleteSession('future')
    })

    await test.step('Only the first occurrence is left', async () => {
      await clientProfilePage.openSessions(testClient.id)
      await clientProfilePage.expectSessionStatus(first, 'Upcoming')
      await clientProfilePage.expectSessionNotListed(second)
      await clientProfilePage.expectSessionNotListed(third)
    })
  })
})
