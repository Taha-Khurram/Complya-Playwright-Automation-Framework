// Download a CI run's full Playwright report (traces, videos, screenshots) and open it locally.
// The public GitHub Pages report has these stripped, because they contain the admin's auth
// token and production data. Needs the GitHub CLI (gh), signed in to an account with repo access.
//
// Usage: npm run report:ci [run-id]   (defaults to the latest E2E run)
const { execFileSync } = require('child_process')
const { rmSync } = require('fs')
const path = require('path')

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim()

const runId =
  process.argv[2] ||
  gh('run', 'list', '--workflow', 'playwright.yml', '--limit', '1', '--json', 'databaseId', '--jq', '.[0].databaseId')
if (!runId) throw new Error('No E2E runs found')

const dir = path.join('ci-report', String(runId))
rmSync(dir, { recursive: true, force: true })
console.log(`Downloading the report from run ${runId} to ${dir} (videos make it a few hundred MB, so this can take minutes)`)
execFileSync('gh', ['run', 'download', runId, '--name', 'playwright-report', '--dir', dir], { stdio: 'inherit' })

execFileSync('npx', ['playwright', 'show-report', dir], { stdio: 'inherit', shell: process.platform === 'win32' })
