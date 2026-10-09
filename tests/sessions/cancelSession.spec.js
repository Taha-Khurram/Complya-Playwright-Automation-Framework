import { test, expect } from '../../fixtures'
import { cancellationReason } from '../../test-data/testData'

test.describe('Cancel session', () => {

  test.describe.configure({ timeout: 120_000 })

  test('Positive: admin cancels a single session with a reason', async ({
    createSession, testClient, schedulePage, sessionFormPage, sessionDetailPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 35 })

    await test.step(`Open it from the Schedule and cancel it as "${cancellationReason}"`, async () => {
      await schedulePage.openSession(session)
      await sessionFormPage.expectEditLoaded()
      await sessionFormPage.cancelSession(cancellationReason)
    })

    await test.step('Session stays listed with a Cancelled status', async () => {
      await clientProfilePage.openSessions(testClient)
      await clientProfilePage.expectSessionStatus(session, 'Cancelled')
      await clientProfilePage.openSession(session)
      await sessionDetailPage.expectDetails({ status: 'Cancelled' })
    })
  })


  test('Negative: a session cannot be cancelled without a reason', async ({
    createSession, testClient, schedulePage, sessionFormPage, sessionDetailPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 36 })

    await schedulePage.openSession(session)
    await sessionFormPage.expectEditLoaded()
    await sessionFormPage.openCancelDialog()

    await expect(sessionFormPage.confirmCancelButton).toBeDisabled()
    await sessionFormPage.dismissDialog(sessionFormPage.cancelDialog)

    await clientProfilePage.openSessionDetails(testClient, session)
    await sessionDetailPage.expectDetails({ status: 'Upcoming' })
  })


  test('Positive: cancelling one occurrence of a recurring session leaves the rest of the series', async ({
    createSession, testClient, schedulePage, sessionFormPage, clientProfilePage,
  }) => {
    const [first, second, third] = await test.step('Schedule a session that repeats daily for 3 days',
      () => createSession({ daysAhead: 40, repeatDays: 2 }))

    await test.step('Open the second occurrence from the Schedule and cancel only that one', async () => {
      await schedulePage.openSession(second)
      await sessionFormPage.expectEditLoaded()
      await sessionFormPage.cancelSession(cancellationReason, 'this')
    })

    await test.step('Only that occurrence is cancelled', async () => {
      await clientProfilePage.openSessions(testClient)
      await clientProfilePage.expectSessionStatus(first, 'Upcoming')
      await clientProfilePage.expectSessionStatus(second, 'Cancelled')
      await clientProfilePage.expectSessionStatus(third, 'Upcoming')
    })
  })
})
