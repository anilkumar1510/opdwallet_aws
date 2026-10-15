import { expect, Page, test } from '@playwright/test';

import { injectSessionCookie } from '../../utils/session';

/**
 * End to end against the REAL habit-opd API (through the dev proxy, port 4500).
 *
 * Skipped unless SESSION_ID is set (a valid `session_id` cookie value), like the
 * other live specs. It creates real test grievances ("[TEST]" text) on the first
 * claim that does not have one yet, so run it sparingly:
 *
 *   SESSION_ID=... npx playwright test tests/e2e/disputes/live-api.spec.ts
 */
test.skip(!process.env.SESSION_ID, 'needs SESSION_ID');
test.use({ headless: true });
test.describe.configure({ mode: 'serial' });

const section = (page: Page, name: string) => page.locator('section', { has: page.getByRole('heading', { name }) });
// Set by the first test; or pass LIVE_TICKET_ID / LIVE_CLAIM_ID to re-check an existing ticket without raising a new one.
let ticketId = process.env.LIVE_TICKET_ID ?? '';
let claimId = process.env.LIVE_CLAIM_ID ?? '';

test('raise a grievance, see it in the thread, reply, refresh and still see everything', async ({ page }) => {
  await injectSessionCookie(page);
  await page.goto('/member/helpline');
  const claims = section(page, 'Claims that need your help');

  // A claim with no ticket yet.
  const ask = claims.getByRole('button', { name: 'Ask for help' }).first();
  await expect(claims.locator('li').first()).toBeVisible({ timeout: 30000 });
  // The list opens on two claims; Load more until one without a ticket shows.
  for (let i = 0; i < 10 && !(await ask.count()); i++) {
    const more = claims.getByRole('button', { name: 'Load more' });
    if (!(await more.count())) break;
    await more.click();
  }
  await expect(ask).toBeVisible({ timeout: 10000 });
  claimId = (await ask.locator('xpath=ancestor::li').locator('p').nth(1).innerText()).split('·')[1].trim();
  await ask.click();

  // "Other" needs a description; commas and colons are in it on purpose.
  await page.selectOption('#g-reason', 'Other');
  await page.fill('#g-detail', '[TEST - please ignore] integration check, with a comma: and a colon. Amount ₹1,500 "quoted" & more.');
  await page.getByRole('button', { name: 'Send to support' }).click();

  await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 30000 });
  ticketId = (await page.getByText(/^DIS-\d{4}-\d+$/).first().innerText()).trim();
  expect(ticketId).toMatch(/^DIS-/);
  // The member's own words are the first message in the thread (comma and colon swapped for lookalikes).
  await expect(page.getByText(/integration check‚ with a comma∶ and a colon\. Amount ₹1‚500 "quoted" & more\./)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('Ticket opened')).toBeVisible();

  // Reply: shows up in the thread from the API.
  await page.fill('#g-reply', '[TEST] first reply ₹500 😊\nsecond line');
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByText('Reply sent.')).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('first reply ₹500 😊')).toBeVisible({ timeout: 20000 });

  // The 3 second guard: the button stays disabled right after a send.
  await page.fill('#g-reply', '[TEST] too soon');
  await expect(page.getByRole('button', { name: 'Send reply' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Send reply' })).toBeEnabled({ timeout: 6000 });
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByText('[TEST] too soon')).toBeVisible({ timeout: 20000 });

  // No fake actions on a real ticket.
  await expect(page.getByText("Demo — support's reply")).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mark resolved' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /reopen/i })).toHaveCount(0);
});

test('after a refresh the claim shows the ticket and the whole thread comes back from the API', async ({ page }) => {
  expect(ticketId).toBeTruthy();
  await injectSessionCookie(page);
  await page.goto('/member/helpline');
  const claims = section(page, 'Claims that need your help');
  await expect(claims.locator('li').first()).toBeVisible({ timeout: 30000 }); // claims have loaded
  const row = claims.locator('li', { hasText: claimId });
  // The list opens on two claims; Load more until the one we raised on is shown.
  for (let i = 0; i < 10 && !(await row.count()); i++) {
    const more = claims.getByRole('button', { name: 'Load more' });
    if (!(await more.count())) break;
    await more.click();
  }
  const chip = row.getByRole('button', { name: /Ticket open|Response received/ });
  await expect(chip).toBeVisible({ timeout: 30000 });
  await chip.click();
  await expect(page.getByText(ticketId, { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('first reply ₹500 😊')).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('[TEST] too soon')).toBeVisible();
});

test('an expired session shows no real claims or tickets and no crash', async ({ page }) => {
  await page.context().addCookies([{ name: 'session_id', value: 'invalid', domain: 'localhost', path: '/' }]);
  await page.goto('/member/helpline');
  await expect(page.getByRole('heading', { name: 'Support' })).toBeVisible();
  // The services section is static demo data and still has its own demo tickets.
  await expect(section(page, 'Claims that need your help').getByText('No claim needs your attention right now.')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/DIS-\d{4}-\d+/)).toHaveCount(0);
});
