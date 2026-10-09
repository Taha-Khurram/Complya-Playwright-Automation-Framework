import { test } from '../../fixtures'

// Deleting moves a session to archived sessions, where an admin can restore it
test.describe('Delete session', () => {

  test.describe.configure({ timeout: 120_000 })

  test('Positive: admin deletes a single session and it leaves the client\'s schedule', async ({
    createSession, testClient, schedulePage, sessionFormPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 45 })

    await test.step('Open the session from the Schedule', async () => {
      await schedulePage.openSession(session)
      await sessionFormPage.expectEditLoaded()
    })

    // deleteSession waits for the "Session deleted successfully" toast
    await test.step('Delete it from the 3-dot menu', () => sessionFormPage.deleteSession())

    await test.step("Session is no longer on the client's list", async () => {
      await clientProfilePage.openSessions(testClient)
      await clientProfilePage.expectSessionNotListed(session)
    })
  })


  test('Negative: backing out of the delete confirmation keeps the session', async ({
    createSession, testClient, schedulePage, sessionFormPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 46 })

    await schedulePage.openSession(session)
    await sessionFormPage.expectEditLoaded()
    await sessionFormPage.openDeleteDialog()
    await sessionFormPage.dismissDialog(sessionFormPage.deleteDialog)

    await clientProfilePage.openSessions(testClient)
    await clientProfilePage.expectSessionStatus(session, 'Upcoming')
  })


  test('Positive: deleting "this and all future" occurrences keeps earlier ones in the series', async ({
    createSession, testClient, schedulePage, sessionFormPage, clientProfilePage,
  }) => {
    const [first, second, third] = await test.step('Schedule a session that repeats daily for 3 days',
      () => createSession({ daysAhead: 50, repeatDays: 2 }))

    await test.step('Open the second occurrence from the Schedule and delete it and all after it', async () => {
      await schedulePage.openSession(second)
      await sessionFormPage.expectEditLoaded()
      await sessionFormPage.deleteSession('future')
    })

    await test.step('Only the first occurrence is left', async () => {
      await clientProfilePage.openSessions(testClient)
      await clientProfilePage.expectSessionStatus(first, 'Upcoming')
      await clientProfilePage.expectSessionNotListed(second)
      await clientProfilePage.expectSessionNotListed(third)
    })
  })
})
