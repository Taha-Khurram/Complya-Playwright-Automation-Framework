import { test, expect } from '../../fixtures'
import { client } from '../../test-data/testData'
import { uniqueName } from '../../utils/unique'

test.describe('Create client', () => {

  test('Positive: admin creates a client and finds them in the client list', async ({ clientsPage }) => {

    const newClient = { ...client, lastName: uniqueName() }
    const fullName = `${newClient.firstName} ${newClient.lastName}`

    await clientsPage.visit()

    await test.step("Add the client, which opens their profile", async () => {
      await clientsPage.createClient(newClient)
    })

    await test.step('Client is listed and active', async () => {
      await clientsPage.visit()
      await clientsPage.search(fullName)
      await expect(clientsPage.clientRow(fullName)).toHaveCount(1)
      await expect(clientsPage.clientRow(fullName)).toContainText(newClient.site)
      await expect(clientsPage.clientRow(fullName)).toContainText(/active/i)
    })
  })


  test('Negative: a client cannot be added without the required details', async ({ clientsPage }) => {

    await clientsPage.visit()
    await clientsPage.openNewClientForm()

    await clientsPage.addClientButton.click()

    for (const error of clientsPage.requiredErrors) await expect(error).toBeVisible()
    await expect(clientsPage.successToast).toBeHidden()
    await expect(clientsPage.dialog).toBeVisible()
  })
})
