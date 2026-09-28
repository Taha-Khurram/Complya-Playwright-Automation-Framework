# Complya E2E Tests

End-to-end UI tests for the [Complya](https://complya.com) web app, written with [Playwright](https://playwright.dev) using the Page Object Model.

## Prerequisites

- Node.js 20 or later
- Internet access to `complya.com` and `api.mail.tm` (the disposable inbox used for email steps)

## Setup

```bash
npm install
npx playwright install chromium
```

## Configuration

Copy `.env.example` to `.env` and fill in the admin credentials. `.env` is git-ignored and loaded by `playwright.config.js`; real environment variables work too.

| Variable         | Purpose                                    | Default                       |
| ---------------- | ------------------------------------------ | ----------------------------- |
| `ADMIN_EMAIL`    | Existing admin account used by admin tests | Required                      |
| `ADMIN_PASSWORD` | Password for that admin account            | Required                      |
| `SLOWMO`         | Delay in ms between actions, for watching headed runs | `0`                |

Tests run against `https://complya.com` (set in `playwright.config.js`) on Desktop Chrome.

## Running tests

```bash
npx playwright test                           # all tests, headless
npx playwright test tests/signUp.spec.js      # one file
npx playwright test -g "complete onboarding"  # tests matching a title
npx playwright test --headed                  # watch the browser
npx playwright test --ui                      # interactive UI mode
npx playwright show-report                    # open the last HTML report
```

To watch one test slowly in PowerShell: `$env:SLOWMO=500; npx playwright test tests/signUp.spec.js --headed`

Every run records a trace, video and screenshots in `test-results/` and the HTML report.

## Test scope

### In scope

| Spec | Scenario |
| ---- | -------- |
| `login.spec.js` | Admin signs in with valid credentials |
| `signUp.spec.js` | New user signs up, verifies their email from a real inbox, completes the 4-step onboarding (profile, company, workspace details, skip team invites) and lands on the dashboard |
| `signUp.spec.js` | Sign up form enables Create Account only for a password of 8+ characters with a special character, and rejects mismatched passwords |
| `forgotPassword.spec.js` | User requests a reset link, receives it in a real inbox, is blocked from weak or mismatched passwords, sets a new password; the old password stops working, the new one signs in, and the link can't be reused |
| `forgotPassword.spec.js` | Forgot password form rejects an empty or badly formatted email, and shows the same confirmation for an unknown email |
| `createSite.spec.js` | Admin creates a site |
| `createClient.spec.js` | Admin creates a client |
| `createStaff.spec.js` | For each permission (Admin, Manager, Clinical, Staff): admin invites a staff member; they open the invite email, create an account, sign in and accept the invite |

## Project structure

```
tests/        Test specs, one user journey per spec
pages/        Page objects: locators and actions for each screen
  components/ Shared UI parts, such as the sidebar
fixtures/     Custom `test` that provides ready-made page objects, an inbox and a second browser context
test-data/    Static test data (accounts, sites, clients, staff, workspace)
utils/        Helpers, such as creating an inbox and waiting for an email
```

Specs import `test` and `expect` from `fixtures/`, not directly from `@playwright/test`.

## Important notes

- **Tests change production data.** Runs create real sites, clients, staff invites and new owner accounts with workspaces on `complya.com`. Nothing is cleaned up automatically.
- **Email tests depend on mail.tm.** Signup and staff invite tests wait up to 90 seconds for an email. If mail.tm is slow or down, those tests fail at the email step.
- **Admin tests need an existing admin account** that already has the site from `test-data/testData.js` (`Test Site`), which the client and staff tests select.
