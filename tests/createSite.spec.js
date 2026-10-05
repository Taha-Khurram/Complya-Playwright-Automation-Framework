import { test } from '../fixtures'
import { admin, site } from '../test-data/testData'

test("User can create a site", async ({ loginPage, sitesPage }) => {

  // Admin sign in is slow when tests run in parallel
  test.setTimeout(60_000)

  await loginPage.login(admin.email, admin.password)

  await sitesPage.open()

  await sitesPage.createSite(site)

})
