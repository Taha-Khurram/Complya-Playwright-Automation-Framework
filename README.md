# Complya E2E Tests

End-to-end UI tests for the [Complya](https://complya.com) web app, written with [Playwright](https://playwright.dev) using the Page Object Model.

## Prerequisites

- Node.js 20 or later
- Internet access to `complya.com` and `api.mail.tm` (the disposable inbox used for email steps)

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then fill in the existing account, for tests/existing-account
```

| Variable         | Purpose                                                | Default               |
| ---------------- | ------------------------------------------------------ | --------------------- |
| `ADMIN_EMAIL`    | Existing account used by `tests/existing-account` only | Required for those tests |
| `ADMIN_PASSWORD` | Password for that account                              | Required for those tests |
| `BASE_URL`       | Environment under test                                 | `https://complya.com` |
| `SLOWMO`         | Delay in ms between actions, for watching headed runs | `0`                   |

`.env` is git-ignored and loaded by `playwright.config.js`; real environment variables work too.
Most tests need no account: every run signs up its own admin (see below). Only `tests/existing-account`
signs in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`; that workspace must have a site called `Test Site`
(`existingAccount` in `test-data/testData.js`). On CI, add both as secrets on the `production` environment.

## Running tests

```bash
npm test                    # everything
npm run test:auth           # sign up, onboarding, login, forgot password
npm run test:admin          # sites, clients, staff, sessions, goals
npm run test:sessions       # session specs only
npm run test:goals          # goal specs only
npm run test:existing       # full session with a signed note, on the existing account
npm run test:headed         # watch the browser, one worker
npm run test:ui             # interactive UI mode
npm run report              # open the last HTML report

npx playwright test -g "Negative"   # only negative tests
```

Failed tests keep a trace, screenshot and video in `test-results/` and the HTML report.

## How it works

Playwright runs five projects:

| Project | What it runs | Signed in? |
| ------- | ------------ | ---------- |
| `setup` | `tests/setup/admin.setup.js` creates a brand new admin: signs up, verifies the email from a real inbox, completes onboarding and creates a site. Saves the session and account to `playwright/.auth/` | - |
| `auth`  | `tests/auth/**` | No, these journeys start signed out. Runs after `setup`, because login and duplicate sign up use its admin |
| `admin` | `tests/admin/**`, `tests/sessions/**`, `tests/goals/**` | Yes, reuses the saved admin session. Runs after `setup` |
| `existing-admin-setup` | `tests/setup/existing-admin.setup.js` signs in with the existing account (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), no sign up | - |
| `existing-admin` | `tests/existing-account/**` | Yes, as the existing account. Runs after `existing-admin-setup` |

Every run therefore works in its own empty workspace, so tests never depend on data left by earlier runs.
Within a run, each worker creates one uniquely named client (`testClient` fixture) and schedules sessions
for it on dates no other test uses. The run's admin is the staff member on those sessions.

## Test scope

Every feature has a positive test and at least one negative test.

| Spec | Positive | Negative |
| ---- | -------- | -------- |
| `auth/signUp` | Sign up, verify email from a real inbox, first sign in lands on onboarding | Invalid email formats never reach the server; weak passwords keep Create Account disabled; mismatched confirm password; existing email; unverified account can't sign in |
| `auth/onboarding` | New owner completes all 4 steps and lands on the dashboard | Invalid NPI keeps the owner on step 3 |
| `auth/login` | Admin signs in and lands on the dashboard | Wrong password; unknown email gets the same error |
| `auth/forgotPassword` | Reset link from a real inbox sets a new password; old one stops working; link can't be reused | Empty or invalid email; unknown email gets the same confirmation |
| `admin/site` | Create a site with workspace autofill | Required fields |
| `admin/client` | Create a client; their profile shows the entered name | Required fields |
| `admin/staff` | Invite staff, who creates an account, signs in and accepts | Invalid email and no permission |
| `sessions/createSession` | Schedule a session; it's listed as Upcoming with the right details | No staff; date in the past |
| `sessions/editSession` | Move a session to a new time | End before start is rejected and nothing changes |
| `sessions/cancelSession` | Cancel a single session with a reason; cancel one occurrence of a recurring session | Cancel Session stays disabled until a reason is chosen |
| `sessions/deleteSession` | Delete a single session; delete "this and all future" occurrences of a recurring session | Backing out of the confirmation keeps the session |
| `goals/goal` | Publish a Trials goal; record trial answers in a session and save them | Required fields; changing an answer replaces it instead of adding an attempt |
| `existing-account/sessionNote` | On the existing account: create a 1:1 session from a client's Sessions tab (+), start it, attempt the client's goal, generate the note with AI and insert it, check the summary shows the note and goal attempts, sign and submit; the session ends, goes to In Review, and View Note shows the saved note, goal results and signature | An empty signature cannot be submitted |

## Project structure

```
tests/
  setup/             admin.setup.js signs up a new admin per run; existing-admin.setup.js signs in with ADMIN_EMAIL
  auth/              Signed-out journeys: sign up, onboarding, login, forgot password
  admin/             Sites, clients, staff
  sessions/          Create, edit, cancel, delete sessions
  goals/             Create and attempt goals
  existing-account/  Journeys on the existing account, e.g. a full session with a signed note
pages/               Page objects: one class per screen, with its locators and actions
  components/        Parts shared by many screens: Sidebar (navigation), Toast (notifications)
fixtures/            The custom `test`: page objects plus ready-made data (adminUser, testClient,
                     createSession, startTodaysSession, createGoal, inbox, ...)
test-data/           Static test data
utils/               Mailbox, dates, unique names, auth file paths
```

Specs import `test` and `expect` from `fixtures/`, not from `@playwright/test`.

## How tests use the app

Tests use the app the way a person does: they click links, menus, tabs, rows and buttons, and
check what is on screen. They never jump to a page by typing its URL. There are only two places
where a URL is opened, both entry points:

| Entry point | Where | Used by |
| ----------- | ----- | ------- |
| The public website, `/home/` | `LoginPage.open()`, then its **Login** link | Signed-out tests (sign up and forgot password continue from links on the login page) |
| The app's home page, `/app/` | `Sidebar.openApp()`, once per new browser tab | Signed-in tests, which then move around with the sidebar |

Common routes, all by clicking:

| To get to | Page object method | Clicks |
| --------- | ------------------ | ------ |
| Clients list | `clientsPage.open()` | Sidebar > Clients |
| A client's profile | `clientProfilePage.open(client)` | Clients > search the last name > click the client |
| A client's sessions | `clientProfilePage.openSessions(client)` | ... > Sessions tab |
| A session's details | `clientProfilePage.openSessionDetails(client, session)` | ... > click the session's row |
| A client's goals | `clientProfilePage.openPrograms(client)` | ... > Programs tab |
| Edit a session | `schedulePage.openSession(session)` | Sidebar > Schedule > the session's week > click its card |
| Staff | `staffManagementPage.open()` | Sidebar > Staff |
| Sites | `sitesPage.open()` | Sidebar > Settings > Sites card |

## Writing a new test

1. **Put it in the right folder.** Signed-out: `tests/auth/`. Signed in as the run's new admin:
   `tests/admin/`, `tests/sessions/` or `tests/goals/`. Needs the existing account: `tests/existing-account/`.
2. **Import from the fixtures** and ask for the page objects and data you need:
   ```js
   import { test, expect } from '../../fixtures'

   test('Positive: admin ...', async ({ testClient, clientProfilePage, sessionDetailPage }) => {
     await clientProfilePage.openSessions(testClient)
     // ...
   })
   ```
3. **Reuse page object methods** for navigation and actions; keep specs to steps and checks.
   Wrap each user-visible step in `test.step('...')` so the report reads like a test case.
4. **A new screen gets a new page object** in `pages/`: locators in the constructor
   (`getByRole`, `getByText`, `getByPlaceholder` first; CSS only when the page has no better
   handle), an `open()` that gets there by clicking, and one method per user action. Add it to
   `fixtures/index.js` so specs can ask for it.
5. **Make data unique** with `uniqueName()` (production already holds many similar records), and
   prefer the fixtures (`testClient`, `createSession`, `createGoal`, `startTodaysSession`) to
   creating data by hand.
6. **Name tests** `Positive: ...` or `Negative: ...`, describing the behaviour, not the clicks.

## Important notes

- **Tests change production data.** Every run creates a new owner account and workspace, plus clients, sites,
  sessions, goals and staff invites in it. Nothing is cleaned up automatically. Names start with `Playwright` and end with a unique suffix so they
  are easy to find. Recurring sessions always have an end date, so no endless series is left behind.
- **Deleted sessions are archived**, not removed; an admin can restore them from the archived sessions list.
- **Email tests depend on mail.tm.** Sign up, onboarding, forgot password and staff invite tests wait up to 90
  seconds for an email. If mail.tm is slow or down, those tests fail at the email step.
- **Goal attempts use a real session.** The goal tests create a 1:1 session for today and click Start Session,
  because goals are only recorded in a started session. These sessions are left "In Session" or with a draft note.
- **`tests/existing-account` writes to the existing account.** Each run adds a client, a goal and a signed
  session (In Review) to the `ADMIN_EMAIL` workspace.
