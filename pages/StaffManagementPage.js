import { expect } from '@playwright/test'
import { toast } from './components/Toast'

// Admin's Staff list at /app/staffs, where staff are invited
export class StaffManagementPage {

  constructor(page) {
    this.page = page
    this.addButton = page.getByRole('main').getByRole('button', { name: 'Add', exact: true })
    // e.g. "1-10 / 25 Staff", shown once the list has loaded
    this.listSummary = page.getByRole('main').getByRole('heading', { name: /\/ \d+ Staff$/i })

    this.dialog = page.getByRole('dialog')
    this.firstNameInput = this.dialog.getByRole('textbox', { name: 'First Name' })
    this.lastNameInput = this.dialog.getByRole('textbox', { name: 'Last Name' })
    this.emailInput = this.dialog.getByRole('textbox', { name: 'Email' })
    this.permissionDropdown = this.dialog.getByRole('button', { name: 'Select', exact: true })
    this.roleDropdown = this.dialog.getByRole('button', { name: 'Select Role Types' })
    this.sitesDropdown = this.dialog.getByRole('button', { name: 'Select Sites' })
    this.sitesSearch = this.dialog.getByRole('textbox', { name: 'Search sites...' })
    this.submitButton = this.dialog.getByRole('button', { name: 'Add', exact: true })

    this.invalidEmailError = this.dialog.getByText('Please enter a valid email address', { exact: true })
    this.permissionRequiredError = this.dialog.getByText('Permission is required', { exact: true })
    this.inviteToast = toast(page, 'Staff invitation sent successfully!')
  }

  async visit() {
    await this.page.goto('/app/staffs')
    await expect(this.listSummary).toBeVisible()
  }

  async openInviteForm() {
    await this.addButton.click()
    await expect(this.dialog).toBeVisible()
  }

  // permission: Admin | Staff | Manager | Clinical, role: Level 1 | Level 2 | Level 3
  async inviteStaff({ firstName, lastName, email, permission, role, sites }) {
    await this.openInviteForm()
    await this.firstNameInput.fill(firstName)
    await this.lastNameInput.fill(lastName)
    await this.emailInput.fill(email)
    await this.permissionDropdown.click()
    await this.dialog.getByRole('button', { name: permission, exact: true }).click()
    await this.roleDropdown.click()
    await this.dialog.getByRole('button', { name: role, exact: true }).click()
    await this.sitesDropdown.click()
    for (const site of sites) {
      await this.sitesSearch.fill(site)
      await this.dialog.getByRole('button', { name: `${site} ${site}` }).first().click()
    }
    await this.submitButton.click()
    await expect(this.inviteToast).toBeVisible()
    await expect(this.dialog).toBeHidden()
  }
}
