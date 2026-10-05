// Set in .env (see .env.example)
export const admin = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
}

export const site = {
  name: "Test Site",
  city: "Test City",
  zip: "38000",
  state: "Test State",
}

export const client = {
  firstName: "Test",
  lastName: "User",
  dateOfBirth: "Choose Wednesday, September 23rd, 2026",
  site: site.name,
  gender: "Male",
}

// email is added in the test from a fresh inbox
export const staff = {
  firstName: "Playwright",
  lastName: "Staff",
  permission: "Staff",
  role: "Level 1",
  sites: [site.name],
  password: "Staff@1234",
}

// Someone signing up on their own; email is added in the test from a fresh inbox
export const newOwner = {
  firstName: "Playwright",
  lastName: "Owner",
  password: "Owner@1234",
}

// Inputs for the sign up form's validation tests
export const signUpForm = {
  validEmails: ["user+tag@example.co.uk", "o'brien@example.com", "first.last@sub.example.com"],
  invalidEmails: ["not-an-email", "user@@example.com", "user name@example.com", "<script>@example.com"],
  // Each breaks a different password rule; `rules` is what the hints should show
  weakPasswords: [
    { label: "too short", value: "Ab@1234", rules: { minLength: false, specialChar: true } },
    { label: "no special character", value: "Abcd12345", rules: { minLength: true, specialChar: false } },
    { label: "only spaces", value: "        ", rules: { minLength: true, specialChar: false } },
  ],
  // Smallest password that passes: exactly 8 characters with one special character
  shortestValidPassword: "Abcdef@1",
  oneCharTooShort: "Abcde@1",
}

export const workspace = {
  companyName: "Playwright Care Ltd",
  phone: "7025550123",
  formattedPhone: "+1 (702) 555-0123",
  npi: "1234567893", // passes the NPI check-digit rule
  ein: "123456789",
  formattedEin: "12-3456789",
  address: "123 Main Street",
  city: "Las Vegas",
  zip: "89101",
  state: "Nevada",
}

// Account created by the forgot password test, then given a new password
export const passwordResetUser = {
  oldPassword: "Owner@1234",
  newPassword: "Reset@1234",
  weakPassword: "short",
}

// Every permission a staff member can be invited with
export const staffPermissions = ["Admin", "Manager", "Clinical", "Staff"]
