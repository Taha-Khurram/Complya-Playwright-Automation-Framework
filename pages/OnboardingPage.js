import { expect } from '@playwright/test'

// 4-step wizard a brand new account owner goes through after their first sign in
export class OnboardingPage {

  constructor(page) {
    this.page = page
    this.continueButton = page.getByRole('button', { name: 'Continue' })

    // Step 1 - Profile
    this.profileHeading = page.getByRole('heading', { name: 'Lets get to know you' })
    this.firstNameInput = page.getByRole('textbox', { name: 'First name' })
    this.lastNameInput = page.getByRole('textbox', { name: 'Last name' })
    this.emailInput = page.getByRole('textbox', { name: 'Email' })
    this.profileToast = page.locator("//div[text()='Profile created Successfully']")

    // Step 2 - Company
    this.companyHeading = page.getByRole('heading', { name: 'Create your workspace' })
    this.companyNameInput = page.getByRole('textbox', { name: 'Company name' })
    this.companyToast = page.locator("//div[text()='WorkSpace Created Successfully!']")

    // Step 3 - Workspace details
    this.workspaceHeading = page.getByRole('heading', { name: 'Workspace Setup' })
    this.organizationNameInput = page.getByRole('textbox', { name: 'Organization Name' })
    // Phone input has no label, only its placeholder
    this.phoneInput = page.getByRole('textbox', { name: '1 (702) 123-4567' })
    this.npiInput = page.getByRole('textbox', { name: 'National Provider Identifier *' })
    this.einInput = page.getByRole('textbox', { name: 'Employer Identification Number *' })
    this.addressInput = page.getByRole('textbox', { name: 'Address *' })
    this.cityInput = page.getByRole('textbox', { name: 'City *' })
    this.zipInput = page.getByRole('textbox', { name: 'ZIP Code *' })
    this.stateInput = page.getByRole('textbox', { name: 'State *' })
    this.workspaceToast = page.locator("//div[text()='Save Successfully!']")

    // Step 4 - Team invites
    this.teamHeading = page.getByRole('heading', { name: 'Collaborate with your team' })
    this.sendInvitesButton = page.getByRole('button', { name: 'Send invites' })
    this.skipButton = page.getByRole('button', { name: 'Skip for now' })
  }

  // Wizard shows its progress as "1/4", "2/4", ...
  async expectStep(number, heading) {
    await expect(this.page).toHaveURL('/app/onboarding')
    await expect(this.page.getByText(`${number}/4`, { exact: true })).toBeVisible()
    await expect(heading).toBeVisible()
  }

  async completeProfile({ firstName, lastName, email }) {
    await this.expectStep(1, this.profileHeading)
    // Email comes from the account and can't be changed here
    await expect(this.emailInput).toBeDisabled()
    await expect(this.emailInput).toHaveValue(email)
    await this.firstNameInput.fill(firstName)
    await this.lastNameInput.fill(lastName)
    await this.continueButton.click()
    await expect(this.profileToast).toBeVisible()
  }

  async createCompany(companyName) {
    await this.expectStep(2, this.companyHeading)
    await this.companyNameInput.fill(companyName)
    await this.continueButton.click()
    await expect(this.companyToast).toBeVisible()
  }

  // phone is digits only - the input already starts with "+1" and formats as you type
  async setUpWorkspace({ companyName, phone, formattedPhone, npi, ein, formattedEin, address, city, zip, state }) {
    await this.expectStep(3, this.workspaceHeading)
    // Organization name is carried over from step 2
    await expect(this.organizationNameInput).toBeDisabled()
    await expect(this.organizationNameInput).toHaveValue(companyName)

    await this.phoneInput.fill(phone)
    await expect(this.phoneInput).toHaveValue(formattedPhone)
    await this.npiInput.fill(npi)
    await this.einInput.fill(ein)
    await expect(this.einInput).toHaveValue(formattedEin)
    await this.addressInput.fill(address)
    await this.cityInput.fill(city)
    await this.zipInput.fill(zip)
    await this.stateInput.fill(state)
    await this.continueButton.click()
    await expect(this.workspaceToast).toBeVisible()
  }

  async skipTeamInvites() {
    await this.expectStep(4, this.teamHeading)
    await expect(this.sendInvitesButton).toBeVisible()
    await this.skipButton.click()
  }
}
