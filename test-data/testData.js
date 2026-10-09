// The admin and their site are created fresh each run by tests/setup/admin.setup.js;
// tests get them from the `adminUser` fixture.

// name is made unique in the test
export const site = {
  name: 'Playwright Site',
  city: 'Test City',
  zip: '38000',
  state: 'Test State',
}

// lastName is made unique and site is set to the run's site in the test
export const client = {
  firstName: 'Playwright',
  lastName: 'Client',
  // Relative to today, since the date picker only allows past dates and opens on the current month
  dateOfBirth: { monthsAgo: 1, day: 15 },
  gender: 'Male',
}

// email and sites are added in the test
export const staff = {
  firstName: 'Playwright',
  lastName: 'Staff',
  permission: 'Staff',
  role: 'Level 1',
  password: 'Staff@1234',
}

// Someone signing up on their own; email is added in the test from a fresh inbox
export const newOwner = {
  firstName: 'Playwright',
  lastName: 'Owner',
  password: 'Owner@1234',
}

export const workspace = {
  companyName: 'Playwright Care Ltd',
  phone: '7025550123',
  formattedPhone: '+1 (702) 555-0123',
  npi: '1234567893', // passes the NPI check-digit rule
  invalidNpi: '12345',
  ein: '123456789',
  formattedEin: '12-3456789',
  address: '123 Main Street',
  city: 'Las Vegas',
  zip: '89101',
  state: 'Nevada',
}

// Inputs for the sign up form's validation tests
export const signUpForm = {
  invalidEmails: ['not-an-email', 'user@@example.com', 'user name@example.com', '  someone@example.com  '],
  // Each breaks a different password rule; `rules` is what the hints should show
  weakPasswords: [
    { label: 'one character too short', value: 'Abcde@1', rules: { minLength: false, specialChar: true } },
    { label: 'no special character', value: 'Abcd12345', rules: { minLength: true, specialChar: false } },
    { label: 'only spaces', value: '        ', rules: { minLength: true, specialChar: false } },
  ],
}

// Account created by the forgot password test, then given a new password
export const passwordResetUser = {
  oldPassword: 'Owner@1234',
  newPassword: 'Reset@1234',
  weakPassword: 'short',
}

// Staff and client are added in the test. Times are 24h, as typed into the time inputs.
export const session = {
  serviceType: 'CMDE 97151',
  modality: 'In Home',
  start: '09:00',
  end: '10:00',
}

export const cancellationReason = 'Client-initiated'

// name is made unique in the test. Trials goals need a named target with mastery and maintenance criteria.
export const goal = {
  name: 'Playwright Goal',
  category: 'Safety',
  description: 'Client waits at the door until an adult says it is safe to cross.',
  instructions: 'Stand at the door with the client and ask them to wait. Record Yes if they wait without a prompt.',
  method: 'Trials',
  target: 'Waits at the door',
  mastery: { percentCorrect: 80, trialsPerSession: 10, sessionsInARow: 2 },
  maintenance: { percentCorrect: 80, trialsPerSession: 10, period: 'Weekly' },
}

// Goal data is only collected for service types like 1:1, High Intensity and Group Therapy
export const goalSessionType = '1:1 97153'

// Text for a client's Preferences tab. `keywords` are concrete details an AI summary of the
// text should keep, matched case-insensitively; `edited` replaces `text` with new details.
export const preferences = {
  text: 'The client loves dinosaurs and calms down quickly under a weighted blanket. ' +
    'Loud vacuum cleaners upset the client, so give a five minute warning before one is used.',
  keywords: [/dinosaur/i, /blanket/i, /vacuum/i],
  edited: {
    text: 'The client is calmest when playing with toy trains. ' +
      'Avoid bright flashing lights, and offer orange juice after each activity.',
    keywords: [/train/i, /light/i, /orange/i],
  },
  // For "Regenerate with prompt": the new summary should only cover what upsets the client
  prompt: 'Only describe what upsets the client, in one sentence. Do not mention toys, dinosaurs or blankets.',
  promptKeywords: [/vacuum/i],
  promptExcludes: [/dinosaur/i, /blanket/i],
}

// The existing account (ADMIN_EMAIL / ADMIN_PASSWORD) used by tests/existing-account.
// New clients there are added to this site, which must already exist in that workspace.
export const existingAccount = {
  site: 'Test Site',
}
