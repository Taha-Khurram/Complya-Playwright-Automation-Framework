import { test } from '../fixtures'
import { admin, client } from '../test-data/testData'

test("User can create a client", async ({ loginPage, clientsPage }) => {

  // Admin sign in is slow when tests run in parallel, and adding a client waits on the form loading
  test.setTimeout(60_000)

  await loginPage.login(admin.email, admin.password)

  await clientsPage.open()

  await clientsPage.createClient(client)

})
