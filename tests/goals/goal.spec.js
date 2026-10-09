import { test, expect } from '../../fixtures'

test.describe('Goals', () => {

  test.describe.configure({ timeout: 150_000 })

  test.describe('Create goal', () => {

    test('Positive: admin publishes a Trials goal and it is in progress for the client', async ({
      createGoal, testClient, clientProfilePage,
    }) => {
      const goal = await test.step('Fill in and publish the goal from the Programs tab', () => createGoal())

      await test.step("Goal is listed on the client's Programs tab", async () => {
        await clientProfilePage.openPrograms(testClient)
        const row = clientProfilePage.goalRow(goal.name)
        await expect(row).toHaveCount(1)
        await expect(row).toContainText(goal.method)
        await expect(row).toContainText('In Progress')
      })
    })


    test('Negative: a goal cannot be published without a name, category and description', async ({
      testClient, clientProfilePage, goalFormPage,
    }) => {
      await clientProfilePage.openPrograms(testClient)
      await clientProfilePage.addNewGoal()

      await goalFormPage.publishButton.click()

      for (const error of goalFormPage.requiredErrors) await expect(error).toBeVisible()
      await expect(goalFormPage.savedToast).toBeHidden()
      await expect(goalFormPage.page).toHaveURL('/app/create-goal')
    })
  })


  // Goals are attempted during a session, so each test starts a 1:1 session for today
  test.describe('Attempt goal', () => {

    test('Positive: trial answers are scored and saved with the session', async ({
      createGoal, startTodaysSession, testClient, clientProfilePage, sessionDetailPage, goalAttemptPage,
    }) => {
      const goal = await createGoal()
      const session = await test.step('Create and start a 1:1 session for today', () => startTodaysSession())

      await test.step('Record a correct and an incorrect trial', async () => {
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

      await test.step('Answers are still there when the session is reopened with Add Note', async () => {
        await clientProfilePage.openSessionDetails(testClient, session)
        await sessionDetailPage.continueNote()
        await goalAttemptPage.expectGoalStarted(goal.name)
        await goalAttemptPage.openGoal(goal.name)
        await goalAttemptPage.expectPercentCorrect('50% (1/2)')
      })
    })


    test('Negative: changing a trial\'s answer replaces it instead of counting a second attempt', async ({
      createGoal, startTodaysSession, goalAttemptPage,
    }) => {
      const goal = await createGoal()
      await test.step('Create and start a 1:1 session for today', () => startTodaysSession())
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
