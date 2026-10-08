# Complya E2E Tests

End-to-end UI tests for the [Complya](https://complya.com) web app, written with [Playwright](https://playwright.dev) using the Page Object Model.

## Prerequisites

- Node.js 20 or later
- Internet access to `complya.com` and `api.mail.tm` (the disposable inbox used for email steps)
- An admin account on Complya that has a site called `Test Site` (see `test-data/testData.js`)

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then fill in the admin credentials
```

| Variable         | Purpose                                                | Default               |
| ---------------- | ------------------------------------------------------ | --------------------- |
| `ADMIN_EMAIL`    | Existing admin account used by the admin tests         | Required              |
| `ADMIN_PASSWORD` | Password for that admin account                        | Required              |
| `BASE_URL`       | Environment under test                                 | `https://complya.com` |
| `SLOWMO`         | Delay in ms between actions, for watching headed runs | `0`                   |

`.env` is git-ignored and loaded by `playwright.config.js`; real environment variables work too.

## Running tests

```bash
npm test                    # everything
npm run test:auth           # sign up, onboarding, login, forgot password
npm run test:admin          # sites, clients, staff, sessions, goals
npm run test:sessions       # session specs only
npm run test:goals          # goal specs only
npm run test:headed         # watch the browser, one worker
npm run test:ui             # interactive UI mode
npm run report              # open the last HTML report

npx playwright test -g "Negative"   # only negative tests
```

Failed tests keep a trace, screenshot and video in `test-results/` and the HTML report.

## How it works

Playwright runs three projects:

| Project | What it runs | Signed in? |
| ------- | ------------ | ---------- |
| `setup` | `tests/setup/admin.setup.js` signs the admin in once and saves the session to `playwright/.auth/` | - |
| `auth`  | `tests/auth/**` | No, these journeys start signed out |
| `admin` | `tests/admin/**`, `tests/sessions/**`, `tests/goals/**` | Yes, reuses the saved admin session. Runs after `setup` |

Session and goal tests need data they can find again on a busy production account, so each worker creates
one uniquely named client (`testClient` fixture) and schedules sessions for it on dates no other test uses.
The admin is the staff member on those sessions.

## Test scope

Every feature has a positive test and at least one negative test.

| Spec | Positive | Negative |
| ---- | -------- | -------- |
| `auth/signUp` | Sign up, verify email from a real inbox, first sign in lands on onboarding | Invalid email formats never reach the server; weak passwords keep Create Account disabled; mismatched confirm password; existing email; unverified account can't sign in |
| `auth/onboarding` | New owner completes all 4 steps and lands on the dashboard | Invalid NPI keeps the owner on step 3 |
| `auth/login` | Admin signs in and lands on the dashboard | Wrong password; unknown email gets the same error |
| `auth/forgotPassword` | Reset link from a real inbox sets a new password; old one stops working; link can't be reused | Empty or invalid email; unknown email gets the same confirmation |
| `admin/site` | Create a site with workspace autofill | Required fields |
| `admin/client` | Create a client and find it in the list | Required fields |
| `admin/staff` | Invite staff, who creates an account, signs in and accepts | Invalid email and no permission |
| `sessions/createSession` | Schedule a session; it's listed as Upcoming with the right details | No staff; date in the past |
| `sessions/editSession` | Move a session to a new time | End before start is rejected and nothing changes |
| `sessions/cancelSession` | Cancel a single session with a reason; cancel one occurrence of a recurring session | Cancel Session stays disabled until a reason is chosen |
| `sessions/deleteSession` | Delete a single session; delete "this and all future" occurrences of a recurring session | Backing out of the confirmation keeps the session |
| `goals/goal` | Publish a Trials goal; record trial answers in a session and save them | Required fields; changing an answer replaces it instead of adding an attempt |

## Project structure

```
tests/
  setup/      Signs the admin in once per run
  auth/       Signed-out journeys
  admin/      Sites, clients, staff
  sessions/   Create, edit, cancel, delete sessions
  goals/      Create and attempt goals
pages/        Page objects: locators and actions for each screen
  components/ Shared parts: sidebar, toast notifications
fixtures/     Custom `test` with page objects, test data (testClient, createSession, createGoal), inboxes
test-data/    Static test data
utils/        Mailbox, dates, unique names, auth file paths
```

Specs import `test` and `expect` from `fixtures/`, not from `@playwright/test`.

## Important notes

- **Tests change production data.** Runs create real clients, sites, sessions, goals, staff invites and new owner
  accounts. Nothing is cleaned up automatically. Names start with `Playwright` and end with a unique suffix so they
  are easy to find. Recurring sessions always have an end date, so no endless series is left behind.
- **Deleted sessions are archived**, not removed; an admin can restore them from the archived sessions list.
- **Email tests depend on mail.tm.** Sign up, onboarding, forgot password and staff invite tests wait up to 90
  seconds for an email. If mail.tm is slow or down, those tests fail at the email step.
- **Goal attempts open the goal screen directly** (`/app/goal-attempt?sessionId=...&clientId=...`), the same URL the
  app's "Add Note" button opens for 1:1 sessions, so the test doesn't have to wait for a session to start.
