import { test, expect } from '../../fixtures'
import { admin } from '../../test-data/testData'

test.describe('Login', () => {

  test.beforeEach(() => {
    test.skip(!admin.email || !admin.password, 'ADMIN_EMAIL / ADMIN_PASSWORD are not set')
  })


  test('Positive: admin signs in with valid credentials and lands on the dashboard', async ({ loginPage, dashboardPage }) => {

    await loginPage.login(admin.email, admin.password)

    // Profile button in the sidebar reads "Profile <name> <email>"
    await dashboardPage.sidebar.expand()
    await expect(dashboardPage.profileButton).toContainText(admin.email)
  })


  test('Negative: wrong password is rejected', async ({ loginPage }) => {

    await loginPage.open()
    await loginPage.signIn(admin.email, 'Wrong@12345')

    await loginPage.expectInvalidCredentials()
  })


  test('Negative: unregistered email gets the same error, so accounts cannot be discovered', async ({ loginPage }) => {

    await loginPage.open()
    await loginPage.signIn(`nobody${Date.now()}@example.com`, 'Wrong@12345')

    await loginPage.expectInvalidCredentials()
  })
})
