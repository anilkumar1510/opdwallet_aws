import { expect, Page, test } from '@playwright/test';

/**
 * Support page grievance flow against a FAKE of the real dispute API.
 *
 * The fake behaves like the real backend, as observed: `GET_PAGE` lists the
 * member's disputes, `GET_DISPUTE_MESSAGES` pages a thread (20 a page), `submit`
 * stores only the reason, `userReply` takes its text in `args` (name:value, so a
 * comma or colon is rejected) and refuses the same action twice within 3
 * seconds. No session or backend is needed. Run with the dev server up (4500).
 * The real thing is covered by live-api.spec.ts.
 */
test.use({ headless: true });

const DAY = 24 * 60 * 60 * 1000;
const GUARD_MS = 3000;

function claimRow(n: number, status: string, label: string, final = false) {
  return {
    claim_id: `OPD-2026-${String(354 - n).padStart(5, '0')}`,
    category: 'Diagnostics',
    provider: 'Sample Lab',
    treatment_date: Date.now() - (n + 1) * DAY,
    original_bill_amount: 1500,
    claim_status: status,
    status: { label, tone: 'neutral', isFinal: final },
  };
}

const CLAIMS = [
  claimRow(0, 'REJECTED', 'Rejected', true),
  claimRow(1, 'DOCUMENTS_REQUIRED', 'Documents needed'),
  claimRow(2, 'UNDER_REVIEW', 'Under review'),
  claimRow(3, 'UNDER_REVIEW', 'Under review'),
  claimRow(4, 'UNDER_REVIEW', 'Under review'),
  claimRow(5, 'UNDER_REVIEW', 'Under review'),
];

interface Dispute {
  id: string;
  name: string;
  claim_id: string;
  selected_reason: string;
  dispute_status: string;
  g_creation_time: number;
  g_modify_time: number;
  final_reason?: string;
}
interface Message {
  id: string;
  dispute_id: string;
  sender_type: 'MEMBER' | 'SUPPORT_EXECUTIVE';
  sender_name: string;
  message_text: string;
  timestamp: number;
}

class FakeApi {
  disputes: Dispute[] = [];
  messages: Message[] = [];
  submits: Record<string, unknown>[] = [];
  submitHeaders: Record<string, string>[] = [];
  replies: { name: string; text: string }[] = [];
  uploads = 0;
  claims: object[] = CLAIMS;
  failSubmit: 'errCode' | 500 | null = null;
  failReply: string | null = null;
  failList = false;
  failMessages = false;
  uploadReply: object | null = null;
  submitDelayMs = 0;
  private lastReplyAt = 0;
  private seq = 0;

  seed(d: Partial<Dispute> & { claim_id: string }, msgs: Array<Pick<Message, 'sender_type' | 'message_text'> & { at?: number }> = []): Dispute {
    const n = ++this.seq;
    const dispute: Dispute = {
      id: `uuid-${n}`,
      name: `DIS-2026-${String(390 + n).padStart(5, '0')}`,
      selected_reason: 'Claim rejected incorrectly',
      dispute_status: 'OPEN',
      g_creation_time: Date.now() - 3600_000,
      g_modify_time: Date.now() - 3600_000,
      ...d,
    };
    this.disputes.push(dispute);
    msgs.forEach((m, i) => this.addMessage(dispute.id, m.sender_type, m.message_text, m.at ?? Date.now() - 3000_000 + i * 1000));
    return dispute;
  }

  addMessage(disputeId: string, type: Message['sender_type'], text: string, at = Date.now()): void {
    this.messages.push({
      id: `m-${this.messages.length + 1}`,
      dispute_id: disputeId,
      sender_type: type,
      sender_name: type === 'MEMBER' ? 'member-user-id' : 'Support Executive',
      message_text: text,
      timestamp: at,
    });
  }

  /** Support answers: what the CRM does through the backend. */
  supportReplies(name: string, text: string, status = 'Awaiting user response'): void {
    const d = this.disputes.find((x) => x.name === name)!;
    this.addMessage(d.id, 'SUPPORT_EXECUTIVE', text);
    d.dispute_status = status;
  }
}

const json = (body: object) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function mockBackend(page: Page, api = new FakeApi()): Promise<FakeApi> {
  await page.route(/\/(habit-opd|account-management|system-management|master-management)\/api\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const q = url.searchParams;
    const isDispute = url.pathname.endsWith('/habit-opd/api/v1/dispute');

    if (isDispute && req.method() === 'GET') {
      const pageNo = Number(q.get('page_no') ?? 0);
      const size = Number(q.get('page_size') ?? 20);
      const slice = <T>(rows: T[]) => rows.slice(pageNo * size, pageNo * size + size);
      if (q.get('queryId') === 'GET_PAGE') {
        if (api.failList) return route.fulfill(json({ errCode: -1, message: 'Invalid Session' }));
        return route.fulfill(json({ errCode: 0, resource: slice([...api.disputes].reverse()) }));
      }
      if (q.get('queryId') === 'GET_DISPUTE_MESSAGES') {
        if (api.failMessages) return route.fulfill(json({ errCode: -1, message: 'Invalid Query' }));
        const id = (q.get('args') ?? '').replace('dispute_id:', '');
        return route.fulfill(json({ errCode: 0, resource: slice(api.messages.filter((m) => m.dispute_id === id)) }));
      }
    }

    if (isDispute && req.method() === 'POST') {
      const form = new URLSearchParams(req.postData() ?? '');
      const encoded = form.get('resource') ?? '';
      const payload = JSON.parse(decodeURIComponent(escape(Buffer.from(encoded, 'base64').toString('binary'))));
      const action = form.get('action');

      if (action === 'submit') {
        api.submits.push(payload);
        api.submitHeaders.push(req.headers());
        if (api.submitDelayMs) await new Promise((r) => setTimeout(r, api.submitDelayMs));
        if (api.failSubmit === 500) return route.fulfill({ status: 500, body: 'boom' });
        if (api.failSubmit === 'errCode') return route.fulfill(json({ errCode: -1, message: 'Claim not found' }));
        const d = api.seed({ claim_id: payload.claim_id, selected_reason: payload.selected_reason, dispute_status: 'OPEN', g_creation_time: Date.now() });
        return route.fulfill(json({ errCode: 0, resource: [{ id: d.id, name: d.name, ticket_id: d.name }] }));
      }

      if (action === 'userReply') {
        const args = form.get('args') ?? '';
        const value = args.replace(/^messageText:/, '');
        if (/[,:]/.test(value)) return route.fulfill(json({ errCode: -1, message: 'args can  have only values of format name:value' }));
        if (Date.now() - api['lastReplyAt'] < GUARD_MS) {
          return route.fulfill(json({ errCode: -1, message: 'You have clicked multiple times for the same action, please wait for 3 seconds.' }));
        }
        if (api.failReply) return route.fulfill(json({ errCode: -1, message: api.failReply }));
        api['lastReplyAt'] = Date.now();
        const d = api.disputes.find((x) => x.id === payload.id)!;
        api.replies.push({ name: payload.name, text: value });
        api.addMessage(d.id, 'MEMBER', value);
        d.dispute_status = 'Awaiting executive response';
        return route.fulfill(json({ errCode: 0, resource: [{ id: d.id, resourceType: 'Dispute', name: d.name }] }));
      }
    }

    if (q.get('queryId') === 'GET_CLAIMS_BY_USER') return route.fulfill(json({ errCode: 0, resource: api.claims }));
    if ((q.get('queryId') ?? '').includes('valueset')) return route.fulfill(json({ errCode: 0, resource: [] }));
    return route.fulfill(json({ errCode: -1, message: 'not mocked' }));
  });

  await page.route('**/dms/api/v1/emrImage', async (route) => {
    api.uploads += 1;
    await route.fulfill(json(api.uploadReply ?? { errCode: 0, resource: [{ document_id: `doc-${api.uploads}`, file_name: 'bill.pdf' }] }));
  });
  return api;
}

const claimsSection = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Claims that need your help' }) });
const servicesSection = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Services you have used' }) });
const claimRowOf = (page: Page, id: string) => claimsSection(page).locator('li', { hasText: id });

async function openSupport(page: Page, api?: FakeApi): Promise<FakeApi> {
  const fake = await mockBackend(page, api);
  await page.goto('/member/helpline');
  await expect(claimsSection(page).getByText('OPD-2026-00354')).toBeVisible({ timeout: 20000 });
  return fake;
}

/** Raise a grievance on the newest claim. */
async function raise(page: Page, reason = 'Claim rejected incorrectly', detail = '') {
  await claimsSection(page).getByRole('button', { name: 'Ask for help' }).first().click();
  await page.selectOption('#g-reason', reason);
  if (detail) await page.fill('#g-detail', detail);
  await page.getByRole('button', { name: /Send to support/ }).click();
}

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

test.describe('Raise a grievance (submit)', () => {
  test('submit sends the claim, reason and signature; the ticket opens with the backend ticket id', async ({ page }) => {
    const api = await openSupport(page);
    await raise(page, 'Claim rejected incorrectly');
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('DIS-2026-00391', { exact: true })).toBeVisible();
    expect(api.submits).toHaveLength(1);
    expect(api.submits[0]).toMatchObject({
      claim_id: 'OPD-2026-00354', category: 'CLAIM', dispute_type: 'GENERAL', benefit_category: 'DIAGNOSTICS',
      selected_reason: 'Claim rejected incorrectly', dispute_status: 'OPEN',
    });
    expect((api.submits[0] as { member_name: string }).member_name).not.toBe('');
    expect(api.submitHeaders[0]['x-xsrf-token']).toBeTruthy();
    await expect(page.getByText('Static demo')).toHaveCount(0);
    await expect(page.getByText("Demo — support's reply")).toHaveCount(0);
  });

  test('the optional details become the first message in the thread (comma and colon swapped)', async ({ page }) => {
    const api = await openSupport(page);
    await raise(page, 'Other', 'Bill is wrong, see note: it was ₹1,500.');
    await expect(page.getByText('Bill is wrong‚ see note∶ it was ₹1‚500.')).toBeVisible({ timeout: 20000 });
    expect(api.replies).toHaveLength(1);
    expect(api.replies[0].text).toBe('Bill is wrong‚ see note∶ it was ₹1‚500.');
  });

  test('no details means no first message, only "Ticket opened"', async ({ page }) => {
    const api = await openSupport(page);
    await raise(page, 'No update for too long');
    await expect(page.getByText('Ticket opened')).toBeVisible({ timeout: 20000 });
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
    expect(api.submits[0]).toMatchObject({ document_ids: ['doc-1'] });
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
    await expect(page.getByRole('alert')).toContainText('larger than 5 MB');
    expect(api.uploads).toBe(1);
    await page.getByRole('button', { name: 'Remove huge.pdf' }).click();
    await page.getByRole('button', { name: 'Send to support' }).click();
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
    expect(api.submits[0]).not.toHaveProperty('document_ids');
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

  test('a resolved ticket shows closed with its final remark, no reply box, no reopen, only the phone route', async ({ page }) => {
    const api = new FakeApi();
    api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Resolved', final_reason: 'Claim re-adjudicated and approved.' }, [
      { sender_type: 'MEMBER', message_text: 'Please re-check' },
      { sender_type: 'SUPPORT_EXECUTIVE', message_text: 'Done' },
    ]);
    await openSupport(page, api);
    await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket closed' }).click();
    await expect(page.getByText('Resolved and closed by support on')).toBeVisible();
    await expect(page.getByText(/Claim re-adjudicated and approved\./)).toBeVisible();
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

  test('no fake actions on a real ticket: no demo support buttons, no Mark resolved, no reopen', async ({ page }) => {
    await openSupport(page);
    await raise(page);
    await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Demo — support's reply")).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Mark resolved' })).toHaveCount(0);
    await expect(page.getByText(/reopen/i)).toHaveCount(0);
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
    await expect(page.getByText('Waiting on support')).toBeVisible();
  });

  test('commas and colons are swapped for lookalikes so the backend accepts them', async ({ page }) => {
    const { api } = await openTicket(page);
    await page.fill('#g-reply', 'Hi, note: see bill');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByText('Hi‚ note∶ see bill')).toBeVisible({ timeout: 20000 });
    expect(api.replies[0].text).toBe('Hi‚ note∶ see bill');
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
