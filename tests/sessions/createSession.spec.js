import { test, expect } from '../../fixtures'
import { session as defaults } from '../../test-data/testData'
import { daysFromToday, timeRange } from '../../utils/dates'

test.describe('Create session', () => {

  test.describe.configure({ timeout: 90_000 })

  test('Positive: admin schedules a single session that shows as upcoming for the client', async ({
    createSession, adminUser, testClient, clientProfilePage, sessionDetailPage,
  }) => {
    const [session] = await test.step('Schedule the session from the Schedule page', () => createSession({ daysAhead: 30 }))

    await test.step("Session is listed on the client's profile as upcoming", async () => {
      await clientProfilePage.openSessions(testClient.id)
      await clientProfilePage.expectSessionStatus(session, 'Upcoming')
    })

    await test.step('Session details match what was entered', async () => {
      await sessionDetailPage.visit(session.id)
      await sessionDetailPage.expectDetails({
        date: session.date.long,
        time: timeRange(session.start, session.end).detail,
        client: testClient.fullName,
        staff: adminUser.fullName,
        serviceType: 'CMDE',
        status: 'Upcoming',
      })
    })
  })


  test('Negative: a session without staff or with a past date is not created', async ({
    adminUser, testClient, schedulePage, sessionFormPage,
  }) => {
    await schedulePage.visit()
    await schedulePage.addSession()

    await test.step('No staff selected', async () => {
      await sessionFormPage.createButton.click()
      await sessionFormPage.expectNotCreated(sessionFormPage.staffRequiredError)
    })

    await test.step('Date in the past', async () => {
      await sessionFormPage.fill({ ...defaults, staff: adminUser.fullName, client: testClient, date: daysFromToday(-7) })
      await sessionFormPage.createButton.click()
      await sessionFormPage.expectNotCreated(sessionFormPage.pastDateError)
    })

    await expect(sessionFormPage.createButton).toBeVisible()
  })
})
