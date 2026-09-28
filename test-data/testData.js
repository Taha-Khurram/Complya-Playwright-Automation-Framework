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
