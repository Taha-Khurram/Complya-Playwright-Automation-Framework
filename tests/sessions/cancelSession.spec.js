import { test, expect } from '../../fixtures'
import { cancellationReason } from '../../test-data/testData'

test.describe('Cancel session', () => {

  test.describe.configure({ timeout: 120_000 })

  test('Positive: admin cancels a single session with a reason', async ({
    createSession, testClient, sessionFormPage, sessionDetailPage, clientProfilePage,
  }) => {
    const [session] = await createSession({ daysAhead: 35 })

    await test.step(`Cancel it as "${cancellationReason}"`, async () => {
      await sessionFormPage.openEdit(session.id)
      await sessionFormPage.cancelSession(cancellationReason)
    })

    await test.step('Session stays listed with a Cancelled status', async () => {
      await sessionDetailPage.visit(session.id)
      await sessionDetailPage.expectDetails({ status: 'Cancelled' })
      await clientProfilePage.openSessions(testClient.id)
      await clientProfilePage.expectSessionStatus(session, 'Cancelled')
    })
  })


  test('Negative: a session cannot be cancelled without a reason', async ({
    createSession, sessionFormPage, sessionDetailPage,
  }) => {
    const [session] = await createSession({ daysAhead: 36 })

    await sessionFormPage.openEdit(session.id)
    await sessionFormPage.openCancelDialog()

    await expect(sessionFormPage.confirmCancelButton).toBeDisabled()
    await sessionFormPage.dismissDialog(sessionFormPage.cancelDialog)

    await sessionDetailPage.visit(session.id)
    await sessionDetailPage.expectDetails({ status: 'Upcoming' })
  })


  test('Positive: cancelling one occurrence of a recurring session leaves the rest of the series', async ({
    createSession, testClient, sessionFormPage, clientProfilePage,
  }) => {
    const [first, second, third] = await test.step('Schedule a session that repeats daily for 3 days',
      () => createSession({ daysAhead: 40, repeatDays: 2 }))

    await test.step('Cancel only the second occurrence', async () => {
      await sessionFormPage.openEdit(second.id)
      await sessionFormPage.cancelSession(cancellationReason, 'this')
    })

    await test.step('Only that occurrence is cancelled', async () => {
      await clientProfilePage.openSessions(testClient.id)
      await clientProfilePage.expectSessionStatus(first, 'Upcoming')
      await clientProfilePage.expectSessionStatus(second, 'Cancelled')
      await clientProfilePage.expectSessionStatus(third, 'Upcoming')
    })
  })
})
