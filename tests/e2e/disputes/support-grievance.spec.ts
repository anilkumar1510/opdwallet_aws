import { expect, Page, test } from '@playwright/test';

import { FakeApi, claimRow, claimRowOf, claimsSection, DAY, mockBackend, openSupport, raise, servicesSection } from './fake-api';


/**
 * Support page grievance flow against a FAKE of the real dispute API.
 *
 * The fake behaves like the real backend, as observed: `GET_PAGE` lists the
 * member's disputes, `GET_DISPUTE_MESSAGES` pages a thread (20 a page), `submit`
 * stores the reason, `final_reason` and `documents`, `userReply` takes its text in
 * `args` (name:value, so a comma or colon is rejected) and refuses the same
 * action twice within 3 seconds. No session or backend is needed. Run with the dev server up (4500).
 * The real thing is covered by live-api.spec.ts.
 */
// test.use({ headless: true });

test.describe('Claims that need your help', () => {
  test('lists the claims from the listing API, newest first, with Load more', async ({ page }) => {
    await openSupport(page);
    const section = claimsSection(page);
    await expect(section.getByText('Rejected', { exact: true })).toBeVisible();
    await expect(section.getByText('OPD-2026-00352')).toHaveCount(0);
    await section.getByRole('button', { name: 'Load more' }).click();
    await expect(section.getByText('OPD-2026-00349')).toBeVisible();
  });

  test('no claims shows the empty state', async ({ page }) => {
    const api = new FakeApi();
    api.claims = [];
    await mockBackend(page, api);
    await page.goto('/member/helpline');
    await expect(claimsSection(page).getByText('No claim needs your attention right now.')).toBeVisible({ timeout: 10000 });
  });

  test('a draft claim is not listed: a grievance cannot be raised on it', async ({ page }) => {
    const api = new FakeApi();
    api.claims = [claimRow(0, 'DRAFT', 'Draft'), claimRow(1, 'UNDER_REVIEW', 'Under review')];
    await mockBackend(page, api);
    await page.goto('/member/helpline');
    const section = claimsSection(page);
    await expect(section.getByText('OPD-2026-00353')).toBeVisible({ timeout: 10000 });
    await expect(section.getByText('OPD-2026-00354')).toHaveCount(0);
  });

  test('a draft that is submitted while the page is open appears after the next refresh', async ({ page }) => {
    await page.clock.install();
    const api = new FakeApi();
    api.claims = [claimRow(0, 'DRAFT', 'Draft'), claimRow(1, 'UNDER_REVIEW', 'Under review')];
    await mockBackend(page, api);
    await page.goto('/member/helpline');
    const section = claimsSection(page);
    await expect(section.getByText('OPD-2026-00353')).toBeVisible({ timeout: 10000 });
    await expect(section.getByText('OPD-2026-00354')).toHaveCount(0);
    // The member submits the draft: it is no longer a draft.
    api.claims = [claimRow(0, 'UNDER_REVIEW', 'Under review'), claimRow(1, 'UNDER_REVIEW', 'Under review')];
    await page.clock.fastForward(31_000);
    await expect(section.getByText('OPD-2026-00354')).toBeVisible({ timeout: 20000 });
  });

  test('only drafts: the empty state shows', async ({ page }) => {
    const api = new FakeApi();
    api.claims = [claimRow(0, 'DRAFT', 'Draft'), claimRow(1, 'draft', 'Draft')];
    await mockBackend(page, api);
    await page.goto('/member/helpline');
    await expect(claimsSection(page).getByText('No claim needs your attention right now.')).toBeVisible({ timeout: 10000 });
  });

  test('claim detail has no Amount / payment section; a cashless order still does', async ({ page }) => {
    await openSupport(page);
    await claimsSection(page).getByText('OPD-2026-00354').click();
    await expect(page.getByText('Order ID')).toBeVisible();
    await expect(page.getByText('Reimbursement', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Amount' })).toHaveCount(0);
    await expect(page.getByText('View invoice')).toHaveCount(0);
    await page.goto('/member/helpline');
    await servicesSection(page).getByText('ORD-24081').click();
    await expect(page.getByRole('heading', { name: 'Amount' })).toBeVisible();
  });
});

/** n distinct claims, newest first. */
function manyClaims(n: number): object[] {
  return Array.from({ length: n }, (_, i) => claimRow(i, 'UNDER_REVIEW', 'Under review'));
}

test.describe('Claims paging (more than 20 claims)', () => {
  // The button reads "Loading…" while the rest is being read, so wait for it to settle.
  const more = (page: Page) => claimsSection(page).getByRole('button', { name: /^(Load more|Loading…)$/ });
  const clickMore = async (page: Page) => {
    await expect(more(page)).toHaveText('Load more', { timeout: 10000 });
    await more(page).click({ timeout: 3000 }); // short: on the last page the button can vanish before the click
  };
  const loadAll = async (page: Page) => {
    for (let i = 0; i < 30; i++) {
      if (!(await more(page).count())) return;
      try { await clickMore(page); } catch { /* it went away between the check and the click */ }
    }
  };

  test('with the real listing bug (later 20-row pages repeat the first) every claim is still reachable', async ({ page }) => {
    const api = new FakeApi();
    api.claims = manyClaims(44);
    api.brokenPaging = true;
    await openSupport(page, api);
    await loadAll(page);
    await expect(claimsSection(page).locator('li')).toHaveCount(44);
    await expect(claimsSection(page).getByText('OPD-2026-00311')).toBeVisible(); // the oldest
    await expect(claimsSection(page).getByText('OPD-2026-00354')).toHaveCount(1); // not duplicated
    await expect(more(page)).toHaveCount(0);
    expect(api.claimPageRequests).toEqual([{ page: 0, size: 20 }, { page: 0, size: 100 }]);
  });

  test('with 6 claims there is nothing more to load and no extra request', async ({ page }) => {
    const api = await openSupport(page);
    await clickMore(page);
    await expect(more(page)).toHaveCount(0);
    await expect(claimsSection(page).locator('li')).toHaveCount(6);
    expect(api.claimPageRequests).toEqual([{ page: 0, size: 20 }]);
  });

  test('exactly 20 claims: Load more checks once, finds nothing new and goes away', async ({ page }) => {
    const api = new FakeApi();
    api.claims = manyClaims(20);
    await openSupport(page, api);
    await loadAll(page);
    await expect(claimsSection(page).locator('li')).toHaveCount(20);
    await expect(more(page)).toHaveCount(0);
    expect(api.claimPageRequests).toEqual([{ page: 0, size: 20 }, { page: 0, size: 100 }]);
  });

  test('more than 100 claims continue on the next large page', async ({ page }) => {
    const api = new FakeApi();
    api.claims = manyClaims(120);
    await openSupport(page, api);
    await loadAll(page);
    await expect(claimsSection(page).locator('li')).toHaveCount(120);
    await expect(more(page)).toHaveCount(0);
    expect(api.claimPageRequests.map((r) => `${r.page}/${r.size}`)).toEqual(['0/20', '0/100', '1/100']);
  });

  test('a failed read shows a message, keeps what is shown, and Load more tries again', async ({ page }) => {
    const api = new FakeApi();
    api.claims = manyClaims(44);
    api.failClaimsPage = 0;
    await openSupport(page, api);
    for (let i = 0; i < 4; i++) await clickMore(page);
    await expect(claimsSection(page).getByRole('alert')).toContainText('could not load more claims');
    await expect(claimsSection(page).locator('li').first()).toBeVisible();
    await loadAll(page);
    await expect(claimsSection(page).locator('li')).toHaveCount(44);
    await expect(claimsSection(page).getByRole('alert')).toHaveCount(0);
  });

  test('a claim beyond the first 20 shows its ticket status', async ({ page }) => {
    const api = new FakeApi();
    api.claims = manyClaims(44);
    api.seed({ claim_id: 'OPD-2026-00320', dispute_status: 'Awaiting user response' }, [{ sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Please upload page 2' }]);
    await openSupport(page, api);
    await loadAll(page);
    await expect(claimRowOf(page, 'OPD-2026-00320').getByRole('button', { name: 'Response received' })).toBeVisible();
  });

  test('rapid clicks on Load more read the rest once', async ({ page }) => {
    const api = new FakeApi();
    api.claims = manyClaims(44);
    await openSupport(page, api);
    for (let i = 0; i < 4; i++) await clickMore(page);
    await loadAll(page);
    expect(api.claimPageRequests.filter((r) => r.size === 100)).toHaveLength(1);
  });
});

test.describe('Raise a grievance (submit)', () => {
  test('submit sends the claim, reason and signature; the ticket opens with the backend ticket id', async ({ page }) => {
    const api = await openSupport(page);
    await raise(page, 'Claim rejected incorrectly');
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('DIS-2026-00391', { exact: true })).toBeVisible();
    expect(api.submits).toHaveLength(1);
    expect(api.submits[0]).toMatchObject({
      claim_id: 'OPD-2026-00354', category: 'CLAIM', benefit_category: 'DIAGNOSTICS',
      selected_reason: 'Claim rejected incorrectly', dispute_status: 'OPEN',
    });
    expect(api.submits[0]).not.toHaveProperty('dispute_type');
    expect((api.submits[0] as { member_name: string }).member_name).not.toBe('');
    expect(api.submitHeaders[0]['x-xsrf-token']).toBeTruthy();
    await expect(page.getByText('Static demo')).toHaveCount(0);
    await expect(page.getByText("Demo — support's reply")).toHaveCount(0);
  });

  test('the optional details become the first message in the thread (commas and colons as typed)', async ({ page }) => {
    const api = await openSupport(page);
    await raise(page, 'Other', 'Bill is wrong, see note: it was ₹1,500.');
    await expect(page.getByText('Bill is wrong, see note: it was ₹1,500.')).toBeVisible({ timeout: 20000 });
    expect(api.replies).toHaveLength(1);
    expect(api.replies[0].text).toBe('Bill is wrong, see note: it was ₹1,500.');
    // The words go in `description`; `final_reason` (support's resolution) is not sent.
    expect(api.submits[0]).toMatchObject({ description: 'Bill is wrong, see note: it was ₹1,500.' });
    expect(api.submits[0]).not.toHaveProperty('final_reason');
  });

  test('a closed ticket does not show the member own words as the support resolution', async ({ page }) => {
    const api = new FakeApi();
    api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Closed', final_reason: 'Bill is wrong, see note: x' }, [
      { sender_type: 'MEMBER', message_text: 'Bill is wrong‚ see note∶ x' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket closed' }).click();
    await expect(page.getByText('Resolved and closed by support', { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/Resolved and closed by support — /)).toHaveCount(0);
  });

  test('a closed ticket shows the support resolution once final_reason has been overwritten', async ({ page }) => {
    const api = new FakeApi();
    api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Closed', final_reason: 'Re-adjudicated and approved.' }, [
      { sender_type: 'MEMBER', message_text: 'Bill is wrong' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket closed' }).click();
    await expect(page.getByText(/Resolved and closed by support — Re-adjudicated and approved\./)).toBeVisible();
  });

  test('no details means no first message, only "Ticket opened"', async ({ page }) => {
    const api = await openSupport(page);
    await raise(page, 'No update for too long');
    await expect(page.getByText('Ticket opened')).toBeVisible({ timeout: 20000 });
    expect(api.replies).toHaveLength(0);
  });

  test('if the first message is refused by the 3 second guard it is retried once and not lost', async ({ page }) => {
    const api = new FakeApi();
    api.rejectReplies = 1;
    await openSupport(page, api);
    await raise(page, 'Other', 'My detailed explanation');
    await expect(page.getByText('My detailed explanation')).toBeVisible({ timeout: 30000 });
    expect(api.replies).toHaveLength(1);
    await expect(page.getByText(/could not be sent/)).toHaveCount(0);
  });

  test('if the first message still fails the ticket opens and the words go back into the reply box', async ({ page }) => {
    const api = new FakeApi();
    api.rejectReplies = 5;
    api.rejectReplyMessage = 'Dispute is locked';
    await openSupport(page, api);
    await raise(page, 'Other', 'Words that must not be lost');
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/your details could not be sent/)).toBeVisible();
    await expect(page.locator('#g-reply')).toHaveValue('Words that must not be lost');
    expect(api.replies).toHaveLength(0);
  });

  test('uploads optional documents to DMS and sends their ids with the submit', async ({ page }) => {
    const api = await openSupport(page);
    await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
    await page.selectOption('#g-reason', 'Claim rejected incorrectly');
    await page.setInputFiles('#g-docs', { name: 'bill.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 sample') });
    await expect(page.getByText('bill.pdf · uploaded')).toBeVisible();
    await page.getByRole('button', { name: 'Send to support' }).click();
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
    expect(api.uploads).toBe(1);
    expect(api.submits[0]).toMatchObject({
      documents: [{ name: 'bill.pdf', document_id: 'doc-1', document_type: 'OTHER', originalname: 'bill.pdf', verification_status: 'PENDING', filetype: 'application/pdf', filesize: '15' }],
      document_ids: ['doc-1'],
    });
  });

  test('reason is required; "Other" also needs a description', async ({ page }) => {
    await openSupport(page);
    await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
    const send = page.getByRole('button', { name: 'Send to support' });
    await expect(send).toBeDisabled();
    await page.selectOption('#g-reason', 'Other');
    await expect(send).toBeDisabled();
    await page.fill('#g-detail', 'Something else went wrong.');
    await expect(send).toBeEnabled();
  });

  test('an errCode -1 from submit shows the message and creates no ticket', async ({ page }) => {
    const api = new FakeApi();
    api.failSubmit = 'errCode';
    await openSupport(page, api);
    await raise(page);
    await expect(page.getByRole('alert')).toContainText('Claim not found');
    await expect(page.getByRole('heading', { name: 'Raise a grievance' })).toBeVisible();
    expect(api.disputes).toHaveLength(0);
  });

  test('an HTTP 500 from submit shows an error and keeps the form', async ({ page }) => {
    const api = new FakeApi();
    api.failSubmit = 500;
    await openSupport(page, api);
    await raise(page);
    await expect(page.getByRole('alert')).toContainText('could not send');
    await expect(page.getByRole('heading', { name: 'Raise a grievance' })).toBeVisible();
  });

  test('a double click submits once', async ({ page }) => {
    const api = new FakeApi();
    api.submitDelayMs = 600;
    await openSupport(page, api);
    await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
    await page.selectOption('#g-reason', 'No update for too long');
    await page.getByRole('button', { name: /Send to support/ }).dblclick();
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
    expect(api.submits).toHaveLength(1);
  });

  test('a failed upload is reported and its id is not sent; an oversize file never reaches DMS', async ({ page }) => {
    const api = new FakeApi();
    api.uploadReply = { errCode: -1, message: 'Unsupported file' };
    await openSupport(page, api);
    await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
    await page.selectOption('#g-reason', 'No update for too long');
    await page.setInputFiles('#g-docs', { name: 'bill.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
    await expect(page.getByText('bill.pdf · failed')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Unsupported file');
    await page.setInputFiles('#g-docs', { name: 'huge.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
    await expect(page.getByRole('alert')).toContainText('Over 5 MB: huge.pdf');
    expect(api.uploads).toBe(1);
    await expect(page.getByText('huge.pdf ·')).toHaveCount(0); // refused up front, never listed
    await page.getByRole('button', { name: 'Remove bill.pdf' }).click(); // the failed one can be removed
    await page.getByRole('button', { name: 'Send to support' }).click();
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
    expect(api.submits[0]).not.toHaveProperty('documents');
  });

  test('only PDF, Word or image files are taken, as in the demo picker; others are named and skipped', async ({ page }) => {
    const api = await openSupport(page);
    await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
    await page.selectOption('#g-reason', 'No update for too long');
    await page.setInputFiles('#g-docs', [
      { name: 'bill.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') },
      { name: 'notes.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('x') },
      { name: 'run.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('x') },
    ]);
    await expect(page.getByText('bill.pdf · uploaded')).toBeVisible();
    await expect(page.getByText('notes.docx · uploaded')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Not a PDF, Word or image file: run.exe');
    await expect(page.getByText('run.exe ·')).toHaveCount(0);
    expect(api.uploads).toBe(2);
  });

  test('the same file picked twice is taken once', async ({ page }) => {
    const api = await openSupport(page);
    await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
    const file = { name: 'bill.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') };
    await page.setInputFiles('#g-docs', file);
    await expect(page.getByText('bill.pdf · uploaded')).toBeVisible();
    await page.setInputFiles('#g-docs', file);
    await expect(page.getByText(/bill\.pdf ·/)).toHaveCount(1);
    expect(api.uploads).toBe(1);
  });

  test('demo orders keep the demo picker, which uploads nothing', async ({ page }) => {
    const api = await openSupport(page);
    await servicesSection(page).getByText('ORD-24081').click();
    await page.getByRole('button', { name: 'Raise a grievance' }).click();
    await expect(page.locator('#g-files')).toHaveCount(1);
    await expect(page.locator('#g-docs')).toHaveCount(0);
    await page.setInputFiles('#g-files', { name: 'demo.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
    await expect(page.getByText('demo.pdf')).toBeVisible();
    expect(api.uploads).toBe(0);
  });

  test('a claim older than 3 months cannot be raised and points to the phone', async ({ page }) => {
    const api = new FakeApi();
    api.claims = [{ ...claimRow(0, 'REJECTED', 'Rejected', true), treatment_date: Date.now() - 120 * DAY }];
    await openSupport(page, api);
    await claimsSection(page).getByText('OPD-2026-00354').click();
    await expect(page.getByText(/window closed on/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Raise a grievance' })).toHaveCount(0);
  });

  test('back from the form starts a fresh form next time and sends nothing', async ({ page }) => {
    const api = await openSupport(page);
    await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
    await page.selectOption('#g-reason', 'No update for too long');
    await page.getByRole('button', { name: 'Back', exact: true }).last().click();
    await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
    await expect(page.locator('#g-reason')).toHaveValue('');
    expect(api.submits).toHaveLength(0);
  });
});

test.describe('Tickets come from the API', () => {
  test('an existing ticket shows on its claim, with the whole thread', async ({ page }) => {
    const api = new FakeApi();
    const d = api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Awaiting user response' }, [
      { sender_type: 'MEMBER', message_text: 'Please re-check' },
      { sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Please upload page 2' },
    ]);
    await openSupport(page, api);
    await expect(claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Response received' })).toBeVisible({ timeout: 20000 });
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Response received' }).click();
    await expect(page.getByText(d.name, { exact: true })).toBeVisible();
    await expect(page.getByText('Please re-check')).toBeVisible();
    await expect(page.getByText('Please upload page 2')).toBeVisible();
    await expect(page.getByText('You', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Support Executive')).toBeVisible();
  });

  test('a refresh keeps the ticket and the thread (nothing is stored in the browser)', async ({ page }) => {
    const api = await openSupport(page);
    await raise(page, 'Other', 'Please review');
    await expect(page.getByText('Please review')).toBeVisible({ timeout: 20000 });
    await page.reload();
    await expect(claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket open' })).toBeVisible({ timeout: 20000 });
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket open' }).click();
    await expect(page.getByText('Please review')).toBeVisible({ timeout: 20000 });
    expect(await page.evaluate(() => sessionStorage.length + localStorage.length)).toBe(0);
    expect(api.disputes).toHaveLength(1);
  });

  test('a claim that already has a ticket opens it instead of a second form', async ({ page }) => {
    const api = await openSupport(page);
    await raise(page);
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'OPD-2026-00354' }).click();
    await expect(page.getByText('You already have a ticket on this claim')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Raise a grievance' })).toHaveCount(0);
    expect(api.submits).toHaveLength(1);
  });

  test('a thread longer than one page (45 messages) is read in full', async ({ page }) => {
    const api = new FakeApi();
    const msgs = Array.from({ length: 45 }, (_, i) => ({ sender_type: (i % 2 ? 'SUPPORT_EXECUTIVE' : 'MEMBER') as 'MEMBER' | 'SUPPORT_EXECUTIVE', message_text: `message number ${i + 1}` }));
    api.seed({ claim_id: 'OPD-2026-00354' }, msgs);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket open' }).click();
    await expect(page.getByText('message number 45', { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('message number 1', { exact: true })).toBeVisible();
    await expect(page.getByText(/^message number \d+$/)).toHaveCount(45);
  });

  test('a support reply that arrives while the page is open appears after the next refresh', async ({ page }) => {
    await page.clock.install();
    const api = new FakeApi();
    const d = api.seed({ claim_id: 'OPD-2026-00354' }, [{ sender_type: 'MEMBER', message_text: 'Please re-check' }]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket open' }).click();
    await expect(page.getByText('Please re-check')).toBeVisible();
    api.supportReplies(d.name, 'We have re-checked, please upload page 2');
    await page.clock.fastForward(31_000);
    await expect(page.getByText('We have re-checked, please upload page 2')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Support has replied')).toBeVisible();
  });

  test('a resolved ticket shows resolved status with remarks and close option', async ({ page }) => {
    const api = new FakeApi();
    api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Resolved', final_reason: 'Claim re-adjudicated and approved.' }, [
      { sender_type: 'MEMBER', message_text: 'Please re-check' },
      { sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Done' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Resolved' }).click();
    await expect(page.getByText('Support has marked this ticket as Resolved.')).toBeVisible();
    await expect(page.getByText(/Resolution remarks:.*Claim re-adjudicated and approved\./)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close Ticket' })).toBeVisible();
    await expect(page.locator('#g-reply')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Jump to text box ↓' })).toBeVisible();
  });

  test('a ticket marked resolved by the member keeps the reply text box and close button available', async ({ page }) => {
    const api = new FakeApi();
    api.seed({
      claim_id: 'OPD-2026-00354',
      dispute_status: 'Resolved',
      last_message_sender: 'MEMBER',
      final_reason: 'I am satisfied with the current status.',
    }, [
      { sender_type: 'MEMBER', message_text: 'Issue details' },
      { sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Checked and clarified' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Resolved' }).click();
    await expect(page.getByText('You marked this ticket as resolved.')).toBeVisible();
    await expect(page.getByText(/Resolution remarks:.*I am satisfied with the current status\./)).toBeVisible();
    await expect(page.locator('#g-reply')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close Ticket' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reply' })).toBeVisible();
  });

  test('a closed ticket shows closed with its final remark, no reply box, no reopen, only the phone route', async ({ page }) => {
    const api = new FakeApi();
    api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Closed', final_reason: 'Claim re-adjudicated and approved.' }, [
      { sender_type: 'MEMBER', message_text: 'Please re-check' },
      { sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Done' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket closed' }).click();
    await expect(page.getByText('Resolved and closed by support on')).toBeVisible();
    await expect(page.getByText(/Resolved and closed by support — Claim re-adjudicated and approved\./)).toBeVisible();
    await expect(page.locator('#g-reply')).toHaveCount(0);
    await expect(page.getByText(/reopen/i)).toHaveCount(0);
    await expect(page.getByText('Want to take it further?')).toBeVisible();
    // Nothing can be raised on a claim that already has a ticket, even a closed one.
    await page.getByRole('button', { name: 'OPD-2026-00354' }).click();
    await expect(page.getByRole('button', { name: 'Raise a grievance' })).toHaveCount(0);
  });

  test('if the ticket list cannot be loaded the page still works and shows the claims', async ({ page }) => {
    const api = new FakeApi();
    api.failList = true;
    await openSupport(page, api);
    await expect(claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ask for help' })).toBeVisible();
  });

  test('if the thread cannot be loaded the ticket still opens, with a note', async ({ page }) => {
    const api = new FakeApi();
    api.failMessages = true;
    api.seed({ claim_id: 'OPD-2026-00354' }, [{ sender_type: 'MEMBER', message_text: 'hidden' }]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket open' }).click();
    await expect(page.getByText('We could not load the latest messages')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Ticket opened')).toBeVisible();
  });

  test('no fake actions on a real ticket: no demo support buttons, no reopen', async ({ page }) => {
    await openSupport(page);
    await raise(page);
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Demo — support's reply")).toHaveCount(0);
    await expect(page.getByText(/reopen/i)).toHaveCount(0);
  });
});

test.describe('Documents on a ticket', () => {
  const withDoc = { name: 'bill.pdf', document_id: 'doc-77', document_type: 'OTHER', originalname: 'bill.pdf', verification_status: 'PENDING', filetype: 'application/pdf', filesize: '15' };

  test('a document attached when raising shows on the ticket and downloads from DMS', async ({ page }) => {
    const api = await openSupport(page);
    await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
    await page.selectOption('#g-reason', 'No update for too long');
    await page.setInputFiles('#g-docs', { name: 'bill.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 sample') });
    await expect(page.getByText('bill.pdf · uploaded')).toBeVisible();
    await page.getByRole('button', { name: 'Send to support' }).click();
    await expect(page.getByText('Documents you attached')).toBeVisible({ timeout: 20000 });
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    expect((await download).suggestedFilename()).toBe('bill.pdf');
    expect(api.dmsFetches).toEqual(['id:doc-1']);
  });

  test('the documents are listed after a refresh too, one row each', async ({ page }) => {
    const api = new FakeApi();
    api.seed({ claim_id: 'OPD-2026-00354', documents: [withDoc, { ...withDoc, document_id: 'doc-78', name: 'rx.png', originalname: 'rx.png' }] });
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket open' }).click();
    await expect(page.getByText('Documents you attached')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Download' })).toHaveCount(2);
    await expect(page.getByText('rx.png')).toBeVisible();
  });

  test('a ticket with no documents has no documents section', async ({ page }) => {
    const api = new FakeApi();
    api.seed({ claim_id: 'OPD-2026-00354' });
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket open' }).click();
    await expect(page.getByText('Your ticket')).toBeVisible();
    await expect(page.getByText('Documents you attached')).toHaveCount(0);
  });

  test('a document that cannot be fetched shows an error and can be tried again', async ({ page }) => {
    const api = new FakeApi();
    api.dmsFetch = 'fail';
    api.seed({ claim_id: 'OPD-2026-00354', documents: [withDoc] });
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket open' }).click();
    await page.getByRole('button', { name: 'Download' }).click();
    await expect(page.getByRole('alert')).toContainText('no longer available');
    api.dmsFetch = 'ok';
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    expect((await download).suggestedFilename()).toBe('bill.pdf');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('Reply (userReply)', () => {
  const openTicket = async (page: Page, api = new FakeApi()) => {
    const d = api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Awaiting user response' }, [
      { sender_type: 'MEMBER', message_text: 'Please re-check' },
      { sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Please upload page 2' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Response received' }).click();
    await expect(page.getByText('Please upload page 2')).toBeVisible({ timeout: 20000 });
    return { api, d };
  };

  test('sends the text in args, shows it in the thread, clears the box, and the ticket is back with support', async ({ page }) => {
    const { api, d } = await openTicket(page);
    await page.fill('#g-reply', 'Uploaded page 2 ₹500 😊\nsecond line');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByText('Reply sent.')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#g-reply')).toHaveValue('');
    await expect(page.getByText(/Uploaded page 2 ₹500 😊/)).toBeVisible({ timeout: 20000 });
    expect(api.replies).toEqual([{ name: d.name, text: 'Uploaded page 2 ₹500 😊\nsecond line' }]);
    // The reply goes to the chat resource, naming the ticket by its uuid.
    expect(api.chatPayloads[0]).toEqual({ resourceType: 'DisputeChat', dispute_id: d.id, message_text: 'Uploaded page 2 ₹500 😊\nsecond line' });
    await expect(page.getByText('Waiting on support')).toBeVisible();
  });

  test('commas and colons are sent as typed', async ({ page }) => {
    const { api } = await openTicket(page);
    await page.fill('#g-reply', 'Hi, note: see bill');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByText('Hi, note: see bill')).toBeVisible({ timeout: 20000 });
    expect(api.replies[0].text).toBe('Hi, note: see bill');
  });

  test('an empty or blank reply cannot be sent', async ({ page }) => {
    await openTicket(page);
    const send = page.getByRole('button', { name: 'Send reply' });
    await expect(send).toBeDisabled();
    await page.fill('#g-reply', '   ');
    await expect(send).toBeDisabled();
  });

  test('the reply box is capped at 2000 characters', async ({ page }) => {
    await openTicket(page);
    await page.fill('#g-reply', 'x'.repeat(2500));
    expect((await page.inputValue('#g-reply')).length).toBe(2000);
  });

  test('a rejected reply shows the reason and keeps what the member wrote', async ({ page }) => {
    const api = new FakeApi();
    api.failReply = 'Dispute is locked';
    await openTicket(page, api);
    await page.fill('#g-reply', 'my careful answer');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByRole('alert')).toContainText('Dispute is locked');
    await expect(page.locator('#g-reply')).toHaveValue('my careful answer');
  });

  test('right after a send the button is disabled for the backend 3 second guard, then works again', async ({ page }) => {
    const { api } = await openTicket(page);
    await page.fill('#g-reply', 'first');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByText('Reply sent.')).toBeVisible({ timeout: 20000 });
    await page.fill('#g-reply', 'second');
    await expect(page.getByRole('button', { name: 'Send reply' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Send reply' })).toBeEnabled({ timeout: 6000 });
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByText('second', { exact: true })).toBeVisible({ timeout: 20000 });
    expect(api.replies.map((r) => r.text)).toEqual(['first', 'second']);
  });

  test('a double click on Send replies once', async ({ page }) => {
    const { api } = await openTicket(page);
    await page.fill('#g-reply', 'only once');
    await page.getByRole('button', { name: 'Send reply' }).dblclick();
    await expect(page.getByText('Reply sent.')).toBeVisible({ timeout: 20000 });
    expect(api.replies).toHaveLength(1);
  });

  test('a ticket that is still with support can be replied to as well', async ({ page }) => {
    const api = new FakeApi();
    api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'OPEN' }, [{ sender_type: 'MEMBER', message_text: 'first' }]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket open' }).click();
    await page.fill('#g-reply', 'one more detail');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByText('Reply sent.')).toBeVisible({ timeout: 20000 });
    expect(api.replies).toHaveLength(1);
  });
});

test.describe('Reply text', () => {
  test('commas and colons arrive verbatim and show as typed in a reply', async ({ page }) => {
    const api = new FakeApi();
    const d = api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Awaiting user response' }, [
      { sender_type: 'MEMBER', message_text: 'Please re-check' },
      { sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Please upload page 2' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Response received' }).click();
    await expect(page.getByText('Please upload page 2')).toBeVisible({ timeout: 20000 });
    await page.fill('#g-reply', 'Note: bill 1, bill 2 ₹1,500');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByText('Reply sent.')).toBeVisible({ timeout: 20000 });
    expect(api.replies).toEqual([{ name: d.name, text: 'Note: bill 1, bill 2 ₹1,500' }]);
    await expect(page.getByText('Note: bill 1, bill 2 ₹1,500')).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Reply on a ticket that support has just closed', () => {
  test('the backend refusal is shown and the ticket is refreshed to closed, nothing is sent twice', async ({ page }) => {
    const api = new FakeApi();
    const d = api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Awaiting user response' }, [
      { sender_type: 'MEMBER', message_text: 'Please re-check' },
      { sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Please upload page 2' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Response received' }).click();
    await expect(page.getByText('Please upload page 2')).toBeVisible({ timeout: 20000 });
    d.dispute_status = 'CLOSED'; // support closes it while the member is typing
    await page.fill('#g-reply', 'Too late');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByText('Ticket closed').or(page.getByText(/closed on|Resolved and closed/)).first()).toBeVisible({ timeout: 20000 });
    expect(api.replies).toEqual([]);
    await expect(page.locator('#g-reply')).toHaveCount(0);
  });
});

test.describe('Mark resolved (userResolve)', () => {
  const openTicket = async (page: Page, api = new FakeApi(), status = 'Awaiting user response') => {
    const d = api.seed({ claim_id: 'OPD-2026-00354', dispute_status: status }, [
      { sender_type: 'MEMBER', message_text: 'Please re-check' },
      { sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Please upload page 2' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button').filter({ hasText: /Response received|Ticket open/ }).first().click();
    await expect(page.getByText('Please upload page 2')).toBeVisible({ timeout: 20000 });
    return { api, d };
  };

  test('resolves the ticket through the API: sends RESOLVED, displays resolution banner and keeps chatbox active', async ({ page }) => {
    const { api, d } = await openTicket(page);
    await page.getByRole('button', { name: 'Mark resolved' }).click();
    await expect(page.getByText('You marked this ticket as resolved.')).toBeVisible({ timeout: 20000 });
    expect(api.resolves).toEqual([d.name]);
    expect(api.resolvePayloads[0]).toEqual({
      resourceType: 'Dispute',
      name: d.name,
      dispute_status: 'RESOLVED',
      final_reason: 'Resolved by member',
    });
    expect(api.replies).toEqual([]);
    await expect(page.getByText('Resolution remarks:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close Ticket' })).toBeVisible();
    await expect(page.getByText(/You can reply below, or close this ticket for good/)).toBeVisible();
  });

  test('is offered while the ticket is still with support, and resolves properly', async ({ page }) => {
    const { api } = await openTicket(page, new FakeApi(), 'Awaiting executive response');
    await page.getByRole('button', { name: 'Mark resolved' }).click();
    await expect(page.getByText('You marked this ticket as resolved.')).toBeVisible({ timeout: 20000 });
    expect(api.resolves).toHaveLength(1);
  });

  test('stays resolved after a refresh (state comes from the API, not the browser)', async ({ page }) => {
    const { api } = await openTicket(page);
    await page.getByRole('button', { name: 'Mark resolved' }).click();
    await expect(page.getByText('You marked this ticket as resolved.')).toBeVisible({ timeout: 20000 });
    await page.reload();
    await expect(claimsSection(page).getByText('OPD-2026-00354')).toBeVisible({ timeout: 20000 });
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: /Resolved/ }).click();
    await expect(page.getByText('You marked this ticket as resolved.')).toBeVisible({ timeout: 20000 });
    expect(api.resolves).toHaveLength(1);
  });

  test('a ticket closed by support is not shown as closed by the member', async ({ page }) => {
    const api = new FakeApi();
    api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'CLOSED', last_message_sender: 'SUPPORT_EXECUTIVE', final_reason: 'Approved.' }, [
      { sender_type: 'MEMBER', message_text: 'Please re-check' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket closed' }).click();
    await expect(page.getByText('Resolved and closed by support on')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('You marked this resolved')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Mark resolved' })).toHaveCount(0);
  });

  test('a refused close shows the reason, keeps the ticket open and can be tried again', async ({ page }) => {
    const { api } = await openTicket(page);
    api.failResolve = 'no dispute named X';
    await page.getByRole('button', { name: 'Mark resolved' }).click();
    await expect(page.getByRole('alert')).toContainText('no dispute named X', { timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Mark resolved' })).toBeVisible();
    api.failResolve = null;
    await page.getByRole('button', { name: 'Mark resolved' }).click();
    await expect(page.getByText('You marked this ticket as resolved.')).toBeVisible({ timeout: 20000 });
    expect(api.resolves).toHaveLength(2);
  });

  test('a double click closes once', async ({ page }) => {
    const api = new FakeApi();
    api.resolveDelayMs = 500;
    await openTicket(page, api);
    const button = page.getByRole('button', { name: 'Mark resolved' });
    await button.dblclick();
    await expect(page.getByText('You marked this ticket as resolved.')).toBeVisible({ timeout: 20000 });
    expect(api.resolves).toHaveLength(1);
  });

  test('a reply typed but not sent does not block closing', async ({ page }) => {
    const { api } = await openTicket(page);
    await page.getByPlaceholder('Write your reply').fill('half a thought');
    await page.getByRole('button', { name: 'Mark resolved' }).click();
    await expect(page.getByText('You marked this ticket as resolved.')).toBeVisible({ timeout: 20000 });
    expect(api.replies).toEqual([]);
    expect(api.resolves).toHaveLength(1);
  });
});

test.describe('Support: demo services stay as they were', () => {
  test('a ticket closed by support on a demo order offers no reopen, only the phone route', async ({ page }) => {
    await openSupport(page);
    await page.getByRole('button', { name: 'In-Clinic Consultation' }).click();
    await page.getByRole('button', { name: 'Ticket closed' }).first().click();
    await expect(page.getByText('TKT-10355', { exact: true })).toBeVisible();
    await expect(page.getByText('Resolved and closed by support on')).toBeVisible();
    await expect(page.getByText(/reopen/i)).toHaveCount(0);
    await expect(page.getByText('Want to take it further?')).toBeVisible();
  });
});

test.describe('Support: something else', () => {
  test('desktop: the call button copies the number instead of a dead tel: link', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockBackend(page);
    await page.goto('/member/helpline');
    const call = page.getByRole('link', { name: /1800-000-0000/ });
    await expect(call).toHaveAttribute('href', 'tel:1800-000-0000');
    await call.click();
    await expect(page.getByText('1800-000-0000 copied')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('1800-000-0000');
  });

  test('the email link is a prefilled mailto and says what is happening', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/member/helpline');
    const mail = page.getByRole('link', { name: /support@opdwallet.com/ });
    expect((await mail.getAttribute('href')) ?? '').toMatch(/^mailto:support@opdwallet\.com\?subject=Support%20request&body=/);
    await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault(), true));
    await mail.click();
    await expect(page.getByText('Opening your email app')).toBeVisible();
  });

  test('mobile (touch): the call button is left to dial', async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } });
    const page = await context.newPage();
    await mockBackend(page);
    await page.goto('/member/helpline');
    const call = page.getByRole('link', { name: /1800-000-0000/ });
    await call.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault())); // stop the real dialer in the test
    await call.tap();
    await expect(page.getByText('copied')).toHaveCount(0);
    await context.close();
  });
});
