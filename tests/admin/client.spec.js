import { test, expect } from '../../fixtures'
import { client } from '../../test-data/testData'
import { uniqueName } from '../../utils/unique'

test.describe('Create client', () => {

  test('Positive: admin creates a client and their profile has the entered details', async ({ adminUser, clientsPage, clientProfilePage }) => {

    const newClient = { ...client, lastName: uniqueName(), site: adminUser.site }
    let clientId

    await clientsPage.visit()

    await test.step('Add the client', async () => {
      clientId = await clientsPage.createClient(newClient)
    })

    await test.step("Client's profile shows their name", async () => {
      await clientProfilePage.expectClient(clientId, newClient)
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
