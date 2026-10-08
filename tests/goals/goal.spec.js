import { test, expect } from '../../fixtures'
import { goalSessionType } from '../../test-data/testData'

test.describe('Goals', () => {

  test.describe.configure({ timeout: 120_000 })

  test.describe('Create goal', () => {

    test('Positive: admin publishes a Trials goal and it is in progress for the client', async ({
      createGoal, testClient, clientProfilePage,
    }) => {
      const goal = await test.step('Fill in and publish the goal', () => createGoal())

      await test.step('Goal is listed on the client\'s Programs tab', async () => {
        await clientProfilePage.openPrograms(testClient.id)
        const row = clientProfilePage.goalRow(goal.name)
        await expect(row).toHaveCount(1)
        await expect(row).toContainText(goal.method)
        await expect(row).toContainText('In Progress')
      })
    })


    test('Negative: a goal cannot be published without a name, category and description', async ({
      testClient, clientProfilePage, goalFormPage,
    }) => {
      await clientProfilePage.openPrograms(testClient.id)
      await clientProfilePage.addNewGoal()

      await goalFormPage.publishButton.click()

      for (const error of goalFormPage.requiredErrors) await expect(error).toBeVisible()
      await expect(goalFormPage.savedToast).toBeHidden()
      await expect(goalFormPage.page).toHaveURL('/app/create-goal')
    })
  })


  test.describe('Attempt goal', () => {

    test('Positive: trial answers are scored and saved with the session', async ({
      createGoal, createSession, testClient, goalAttemptPage,
    }) => {
      const goal = await createGoal()
      const [session] = await createSession({ daysAhead: 60, serviceType: goalSessionType })
      const ids = { sessionId: session.id, clientId: testClient.id }

      await test.step('Record a correct and an incorrect trial', async () => {
        await goalAttemptPage.open(ids)
        await goalAttemptPage.openGoal(goal.name)
        await goalAttemptPage.answerTrial(1, 'Yes')
        await goalAttemptPage.answerTrial(2, 'No')
        await goalAttemptPage.expectPercentCorrect('50% (1/2)')
        await goalAttemptPage.closeGoal()
        await goalAttemptPage.expectGoalStarted(goal.name)
      })

      await test.step('Save the session note as a draft', async () => {
        await goalAttemptPage.saveDraft()
      })

      await test.step('Answers are still there when the session is reopened', async () => {
        await goalAttemptPage.open(ids)
        await goalAttemptPage.expectGoalStarted(goal.name)
        await goalAttemptPage.openGoal(goal.name)
        await goalAttemptPage.expectPercentCorrect('50% (1/2)')
      })
    })


    test('Negative: changing a trial\'s answer replaces it instead of counting a second attempt', async ({
      createGoal, createSession, testClient, goalAttemptPage,
    }) => {
      const goal = await createGoal()
      const [session] = await createSession({ daysAhead: 61, serviceType: goalSessionType })

      await goalAttemptPage.open({ sessionId: session.id, clientId: testClient.id })
      await goalAttemptPage.openGoal(goal.name)

      await test.step('Answer trial 1 correctly', async () => {
        await goalAttemptPage.answerTrial(1, 'Yes')
        await goalAttemptPage.expectPercentCorrect('100% (1/1)')
      })

      await test.step('Change trial 1 to incorrect: still one attempt', async () => {
        await goalAttemptPage.answerTrial(1, 'No')
        await goalAttemptPage.expectPercentCorrect('0% (0/1)')
      })

      await test.step('Click the same answer again: attempt is cleared', async () => {
        await goalAttemptPage.answerTrial(1, 'No')
        await goalAttemptPage.expectPercentCorrect('0% (0/0)')
      })
    })
  })
})
