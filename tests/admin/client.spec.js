import { test, expect } from '../../fixtures'
import { client } from '../../test-data/testData'
import { uniqueName } from '../../utils/unique'

test.describe('Create client', () => {

  test('Positive: admin creates a client, finds them in the list and their profile has the entered details', async ({ adminUser, clientsPage, clientProfilePage }) => {

    const newClient = { ...client, lastName: uniqueName(), site: adminUser.site }

    await test.step('Add the client from Clients > Add', async () => {
      await clientsPage.open()
      await clientsPage.createClient(newClient)
    })

    await test.step('Find the client in the list and open their profile: it shows their name', async () => {
      await clientProfilePage.expectClient(newClient)
    })
  })


  test('Negative: a client cannot be added without the required details', async ({ clientsPage }) => {

    await clientsPage.open()
    await clientsPage.openNewClientForm()

    await clientsPage.addClientButton.click()

    for (const error of clientsPage.requiredErrors) await expect(error).toBeVisible()
    await expect(clientsPage.successToast).toBeHidden()
    await expect(clientsPage.dialog).toBeVisible()
  })
})
