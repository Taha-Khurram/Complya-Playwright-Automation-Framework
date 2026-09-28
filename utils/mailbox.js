import { expect } from '@playwright/test'

// Free disposable inbox API (https://docs.mail.tm) - no API key needed
const MAIL_API = 'https://api.mail.tm'

// Creates a fresh, real inbox and returns its address + auth token
export async function createInbox(request, prefix = 'staff') {

  const domains = await (await request.get(`${MAIL_API}/domains`)).json()

  const domain = domains['hydra:member'][0].domain

  const address = `${prefix}${Date.now()}@${domain}`

  const password = 'Inbox@12345'

  // mail.tm rate limits per IP, which parallel tests can hit - wait and try again
  let account
  for (let attempt = 1; attempt <= 5; attempt++) {
    account = await request.post(`${MAIL_API}/accounts`, { data: { address, password } })
    if (account.status() !== 429) break
    await new Promise(resolve => setTimeout(resolve, attempt * 2000))
  }

  if (!account.ok()) throw new Error(`Inbox creation failed: ${account.status()} ${await account.text()}`)

  const { token } = await (await request.post(`${MAIL_API}/token`, { data: { address, password } })).json()

  return { address, token }
}

// Polls the inbox until an email whose subject matches `subject` arrives, then returns its HTML
export async function waitForEmail(request, inbox, subject, timeout = 90_000) {

  const headers = { Authorization: `Bearer ${inbox.token}` }

  let messageId

  await expect.poll(async () => {
    const res = await request.get(`${MAIL_API}/messages`, { headers })
    const messages = (await res.json())['hydra:member'] ?? []
    messageId = messages.find(m => subject.test(m.subject))?.id
    return messageId
  }, { message: `No email matching ${subject} received`, timeout, intervals: [3000] }).toBeTruthy()

  const message = await (await request.get(`${MAIL_API}/messages/${messageId}`, { headers })).json()

  return { subject: message.subject, html: [].concat(message.html).join('') }
}
