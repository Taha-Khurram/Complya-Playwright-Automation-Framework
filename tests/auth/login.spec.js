import { test } from '../../fixtures'

// Signs in as the admin created for this run by tests/setup/admin.setup.js
test.describe('Login', () => {

  test('Positive: admin signs in with valid credentials and lands on the dashboard', async ({ adminUser, loginPage, dashboardPage }) => {

    await loginPage.login(adminUser.email, adminUser.password)

    // Profile button in the sidebar reads "Profile <name> <email>"
    await dashboardPage.expectSignedInAs(adminUser.fullName, adminUser.email)
  })


  test('Negative: wrong password is rejected', async ({ adminUser, loginPage }) => {

    await loginPage.open()
    await loginPage.signIn(adminUser.email, 'Wrong@12345')

    await loginPage.expectInvalidCredentials()
  })


  test('Negative: unregistered email gets the same error, so accounts cannot be discovered', async ({ loginPage }) => {

    await loginPage.open()
    await loginPage.signIn(`nobody${Date.now()}@example.com`, 'Wrong@12345')

    await loginPage.expectInvalidCredentials()
  })
})
