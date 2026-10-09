import { test, expect } from '../../fixtures'
import { site } from '../../test-data/testData'
import { uniqueName } from '../../utils/unique'

test.describe('Create site', () => {

  test('Positive: admin creates a site with details autofilled from the workspace', async ({ sitesPage }) => {

    await sitesPage.open()

    await sitesPage.createSite({ ...site, name: `Playwright Site ${uniqueName()}` })
  })


  test('Negative: a site cannot be saved without its required details', async ({ sitesPage }) => {

    await sitesPage.open()
    await sitesPage.openNewSiteForm()

    await sitesPage.saveButton.click()

    for (const error of sitesPage.requiredErrors) await expect(error).toBeVisible()
    await expect(sitesPage.successToast).toBeHidden()
    await expect(sitesPage.saveButton).toBeVisible()
  })
})
