import { test } from '../fixtures'
import { admin } from '../test-data/testData'

test("User can login using valid credentials", async ({ loginPage }) => {

  await loginPage.login(admin.email, admin.password)

})
