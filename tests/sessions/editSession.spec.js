import { test, expect } from '../../fixtures'
import { timeRange } from '../../utils/dates'

test.describe('Edit session', () => {

  test.describe.configure({ timeout: 90_000 })

  test('Positive: admin moves a session to a new time', async ({
    createSession, testClient, schedulePage, sessionFormPage, sessionDetailPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 32 })
    const rescheduled = { ...session, start: '11:00', end: '12:30' }

    await test.step('Open the session from the Schedule and change its times', async () => {
      await schedulePage.openSession(session)
      await sessionFormPage.expectEditLoaded()
      await sessionFormPage.update(rescheduled)
    })

    await test.step("Client's session list shows the new time only", async () => {
      await clientProfilePage.openSessions(testClient)
      await clientProfilePage.expectSessionStatus(rescheduled, 'Upcoming')
      await clientProfilePage.expectSessionNotListed(session)
    })

    await test.step('Session details show the new time', async () => {
      await clientProfilePage.openSession(rescheduled)
      await sessionDetailPage.expectDetails({ time: timeRange(rescheduled.start, rescheduled.end).detail, status: 'Upcoming' })
    })
  })


  test('Negative: an end time before the start time is rejected and nothing changes', async ({
    createSession, testClient, schedulePage, sessionFormPage, sessionDetailPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 33 })

    await schedulePage.openSession(session)
    await sessionFormPage.expectEditLoaded()
    // The app reads 11:00 -> 10:00 as an overnight session of 23 hours
    await sessionFormPage.setTimes('11:00', '10:00')
    await sessionFormPage.updateButton.click()

    await expect(sessionFormPage.durationError).toBeVisible()
    await expect(sessionFormPage.page).toHaveURL(/\/app\/edit-session\//)

    await clientProfilePage.openSessionDetails(testClient, session)
    await sessionDetailPage.expectDetails({ time: timeRange(session.start, session.end).detail })
  })
})
