import { test } from '../fixtures'
import { admin, staff } from '../test-data/testData'
import { waitForEmail } from '../utils/mailbox'
import { EmailPage } from '../pages/EmailPage'
import { SignUpPage } from '../pages/SignUpPage'
import { LoginPage } from '../pages/LoginPage'
import { AcceptInvitePage } from '../pages/AcceptInvitePage'


test("Admin can invite a staff and staff can accept the invitation", async ({ loginPage, staffManagementPage, inbox, staffContext, request }) => {

  // Whole flow includes waiting for an email, so give it more time than the default 30s
  test.setTimeout(180_000)


  // Admin invites the staff

  await loginPage.login(admin.email, admin.password)

  await staffManagementPage.open()

  await staffManagementPage.inviteStaff({ ...staff, email: inbox.address })


  // Staff opens the invite email and clicks Accept Invitation, which opens in the same tab

  const inviteEmail = await waitForEmail(request, inbox, /invit/i)

  const staffTab = await staffContext.newPage()

  const emailPage = new EmailPage(staffTab)

  await emailPage.open(inviteEmail.html)

  await emailPage.acceptInvitation()


  // Staff signs up, signs in and accepts the invite in that same tab

  const signUpPage = new SignUpPage(staffTab)

  await signUpPage.expectEmailPrefilled(inbox.address)

  await signUpPage.createAccount(staff.password)

  const staffLoginPage = new LoginPage(staffTab)

  await staffLoginPage.expectEmailPrefilled(inbox.address)

  await staffLoginPage.signIn(inbox.address, staff.password)

  await staffLoginPage.expectSignInSuccess()

  await new AcceptInvitePage(staffTab).accept(`${staff.firstName} ${staff.lastName}`)

})
