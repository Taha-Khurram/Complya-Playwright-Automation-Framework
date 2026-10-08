import { test, expect } from '../../fixtures'
import { timeRange } from '../../utils/dates'

test.describe('Edit session', () => {

  test.describe.configure({ timeout: 90_000 })

  test('Positive: admin moves a session to a new time', async ({
    createSession, testClient, sessionFormPage, sessionDetailPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 32 })
    const rescheduled = { ...session, start: '11:00', end: '12:30' }

    await test.step('Change the start and end time', async () => {
      await sessionFormPage.openEdit(session.id)
      await sessionFormPage.update(rescheduled)
    })

    await test.step('Session details show the new time', async () => {
      await sessionDetailPage.visit(session.id)
      await sessionDetailPage.expectDetails({ time: timeRange(rescheduled.start, rescheduled.end).detail, status: 'Upcoming' })
    })

    await test.step("Client's session list shows the new time only", async () => {
      await clientProfilePage.openSessions(testClient.id)
      await clientProfilePage.expectSessionStatus(rescheduled, 'Upcoming')
      await clientProfilePage.expectSessionNotListed(session)
    })
  })


  test('Negative: an end time before the start time is rejected and nothing changes', async ({
    createSession, sessionFormPage, sessionDetailPage,
  }) => {
    const [session] = await createSession({ daysAhead: 33 })

    await sessionFormPage.openEdit(session.id)
    // The app reads 11:00 -> 10:00 as an overnight session of 23 hours
    await sessionFormPage.setTimes('11:00', '10:00')
    await sessionFormPage.updateButton.click()

    await expect(sessionFormPage.durationError).toBeVisible()
    await expect(sessionFormPage.page).toHaveURL(`/app/edit-session/${session.id}`)

    await sessionDetailPage.visit(session.id)
    await sessionDetailPage.expectDetails({ time: timeRange(session.start, session.end).detail })
  })
})
