import { test } from '../fixtures'
import { admin, site } from '../test-data/testData'

test("User can create a site", async ({ loginPage, sitesPage }) => {

  await loginPage.login(admin.email, admin.password)

  await sitesPage.open()

  await sitesPage.createSite(site)

})
