import { test } from '../fixtures'
import { admin, client } from '../test-data/testData'

test("User can create a client", async ({ loginPage, clientsPage }) => {

  await loginPage.login(admin.email, admin.password)

  await clientsPage.open()

  await clientsPage.createClient(client)

})
