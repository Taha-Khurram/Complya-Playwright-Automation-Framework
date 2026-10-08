import { test, expect } from '../../fixtures'
import { staff } from '../../test-data/testData'
import { waitForEmail } from '../../utils/mailbox'
import { EmailPage } from '../../pages/EmailPage'
import { SignUpPage } from '../../pages/SignUpPage'
import { LoginPage } from '../../pages/LoginPage'
import { AcceptInvitePage } from '../../pages/AcceptInvitePage'

test.describe('Create staff', () => {

  test('Positive: admin invites a staff member, who creates an account and accepts the invite', async ({
    adminUser, staffManagementPage, inbox, staffContext, request,
  }) => {
    // Waits for a real invitation email
    test.setTimeout(180_000)

    const member = { ...staff, email: inbox.address, sites: [adminUser.site] }

    await test.step('Admin sends the invite', async () => {
      await staffManagementPage.visit()
      await staffManagementPage.inviteStaff(member)
    })

    // The staff member uses their own browser session from here on
    const staffTab = await staffContext.newPage()

    await test.step('Staff opens "Accept Invitation" from the email', async () => {
      const inviteEmail = await waitForEmail(request, inbox, /invit/i)
      const emailPage = new EmailPage(staffTab)
      await emailPage.open(inviteEmail.html)
      await emailPage.acceptInvitation()
    })

    await test.step('Staff creates their account with the invited email', async () => {
      const signUpPage = new SignUpPage(staffTab)
      await signUpPage.expectEmailPrefilled(member.email)
      await signUpPage.createInvitedAccount(member.password)
    })

    await test.step('Staff signs in and accepts the invite', async () => {
      const loginPage = new LoginPage(staffTab)
      await loginPage.expectEmailPrefilled(member.email)
      await loginPage.signIn(member.email, member.password)
      await loginPage.expectSignInSuccess()
      await new AcceptInvitePage(staffTab).accept(`${member.firstName} ${member.lastName}`)
    })
  })


  test('Negative: an invite with an invalid email and no permission is not sent', async ({ staffManagementPage }) => {

    await staffManagementPage.visit()
    await staffManagementPage.openInviteForm()

    await staffManagementPage.firstNameInput.fill(staff.firstName)
    await staffManagementPage.lastNameInput.fill(staff.lastName)
    await staffManagementPage.emailInput.fill('not-an-email')
    await staffManagementPage.submitButton.click()

    await expect(staffManagementPage.invalidEmailError).toBeVisible()
    await expect(staffManagementPage.permissionRequiredError).toBeVisible()
    await expect(staffManagementPage.inviteToast).toBeHidden()
    await expect(staffManagementPage.dialog).toBeVisible()
  })
})
