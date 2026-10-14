import { expect, Page, test } from '@playwright/test';

/**
 * Support page grievance flow against a mocked backend.
 *
 * No real session or backend is needed: the claims listing, the dispute submit
 * and the DMS upload are intercepted, so this checks what the portal sends and
 * how it reacts. Run with the dev server up (`npm start`, port 4500).
 */
test.use({ headless: true });

const DAY = 24 * 60 * 60 * 1000;

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

interface Mocks {
  disputeBodies: string[];
  disputeHeaders: Record<string, string>[];
  uploads: number;
}

async function mockBackend(page: Page, opts: { disputeReply?: object } = {}): Promise<Mocks> {
  const mocks: Mocks = { disputeBodies: [], disputeHeaders: [], uploads: 0 };
  const json = (body: object) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

  await page.route(/\/(habit-opd|account-management|system-management|master-management)\/api\//, async (route) => {
    const url = route.request().url();
    if (route.request().method() === 'POST' && url.includes('/habit-opd/api/v1/dispute')) {
      mocks.disputeBodies.push(route.request().postData() ?? '');
      mocks.disputeHeaders.push(route.request().headers());
      return route.fulfill(json(opts.disputeReply ?? { errCode: 0, resource: [{ ticket_id: 'GR-CLM-2026-00042' }] }));
    }
    if (url.includes('GET_CLAIMS_BY_USER')) return route.fulfill(json({ errCode: 0, resource: CLAIMS }));
    if (url.includes('valueset')) return route.fulfill(json({ errCode: 0, resource: [] }));
    return route.fulfill(json({ errCode: -1, message: 'not mocked' }));
  });
  await page.route('**/dms/api/v1/emrImage', async (route) => {
    mocks.uploads += 1;
    await route.fulfill(json({ errCode: 0, resource: [{ document_id: `doc-${mocks.uploads}`, file_name: 'bill.pdf' }] }));
  });
  return mocks;
}

function decode(body: string): Record<string, unknown> {
  const encoded = new URLSearchParams(body.replace(/\+/g, '%2B')).get('resource') ?? '';
  return JSON.parse(decodeURIComponent(escape(Buffer.from(encoded, 'base64').toString('binary'))));
}

const claimsSection = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Claims that need your help' }) });

test.describe('Support: claims that need your help', () => {
  test('lists the claims from the listing API, newest first, with Load more', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/member/helpline');
    const section = claimsSection(page);
    await expect(section.getByText('OPD-2026-00354')).toBeVisible({ timeout: 20000 });
    await expect(section.getByText('Rejected', { exact: true })).toBeVisible();
    await expect(section.getByText('OPD-2026-00352')).toHaveCount(0); // third row hidden until Load more
    await section.getByRole('button', { name: 'Load more' }).click();
    await expect(section.getByText('OPD-2026-00349')).toBeVisible();
  });

  test('claim detail has no Amount / payment section; a cashless order still does', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/member/helpline');
    await claimsSection(page).getByText('OPD-2026-00354').click();
    await expect(page.getByText('Order ID')).toBeVisible();
    await expect(page.getByText('Reimbursement', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Amount' })).toHaveCount(0);
    await expect(page.getByText('View invoice')).toHaveCount(0);
    await expect(page.getByText('Paid via wallet')).toHaveCount(0);

    await page.goto('/member/helpline');
    await page.locator('section', { has: page.getByRole('heading', { name: 'Services you have used' }) }).getByText('ORD-24081').click();
    await expect(page.getByRole('heading', { name: 'Amount' })).toBeVisible();
  });
});

test.describe('Support: raise a grievance on a claim', () => {
  test('uploads optional documents and calls the dispute API on submit', async ({ page }) => {
    const mocks = await mockBackend(page);
    await page.goto('/member/helpline');
    const section = claimsSection(page);
    await expect(section.getByText('OPD-2026-00354')).toBeVisible({ timeout: 20000 });
    await section.getByRole('button', { name: 'Ask for help' }).first().click();

    await expect(page.getByRole('heading', { name: 'Raise a grievance' })).toBeVisible();
    await expect(page.getByText('Upload supporting documents')).toBeVisible();
    const send = page.getByRole('button', { name: 'Send to support' });
    await expect(send).toBeDisabled();

    await page.selectOption('#g-reason', 'Claim rejected incorrectly');
    await expect(send).toBeEnabled(); // documents are optional

    await page.setInputFiles('#g-docs', { name: 'bill.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 sample') });
    await expect(page.getByText('bill.pdf · uploaded')).toBeVisible();
    await page.fill('#g-detail', 'The approved amount is lower than the bill.');
    await send.click();

    await expect(page.getByText('Your ticket')).toBeVisible();
    await expect(page.getByText('GR-CLM-2026-00042').first()).toBeVisible();
    await expect(page.getByText('Static demo')).toHaveCount(0); // real claim: data is saved
    await expect(page.getByText("Demo — support's reply")).toHaveCount(0); // support answers from the CRM, not from here

    expect(mocks.uploads).toBe(1);
    expect(mocks.disputeBodies).toHaveLength(1);
    const body = mocks.disputeBodies[0];
    expect(body).toMatch(/&application=habit-opd&action=submit$/);
    expect(mocks.disputeHeaders[0]['x-xsrf-token']).toBeTruthy();
    expect(decode(body)).toMatchObject({
      claim_id: 'OPD-2026-00354',
      category: 'CLAIM',
      dispute_type: 'GENERAL',
      benefit_category: 'DIAGNOSTICS',
      selected_reason: 'Claim rejected incorrectly',
      dispute_status: 'OPEN',
      description: 'The approved amount is lower than the bill.',
      document_ids: ['doc-1'],
    });
  });

  test('works with no documents, and "Other" still needs a description', async ({ page }) => {
    const mocks = await mockBackend(page);
    await page.goto('/member/helpline');
    const section = claimsSection(page);
    await expect(section.getByText('OPD-2026-00354')).toBeVisible({ timeout: 20000 });
    await section.getByRole('button', { name: 'Ask for help' }).first().click();
    const send = page.getByRole('button', { name: 'Send to support' });
    await page.selectOption('#g-reason', 'Other');
    await expect(send).toBeDisabled();
    await page.fill('#g-detail', 'Something else went wrong.');
    await expect(send).toBeEnabled();
    await send.click();
    await expect(page.getByText('Your ticket')).toBeVisible();
    expect(decode(mocks.disputeBodies[0])).not.toHaveProperty('document_ids');
  });

  test('shows the API error and creates no ticket when submit fails', async ({ page }) => {
    await mockBackend(page, { disputeReply: { errCode: -1, message: 'Claim not found' } });
    await page.goto('/member/helpline');
    const section = claimsSection(page);
    await expect(section.getByText('OPD-2026-00354')).toBeVisible({ timeout: 20000 });
    await section.getByRole('button', { name: 'Ask for help' }).first().click();
    await page.selectOption('#g-reason', 'No update for too long');
    await page.getByRole('button', { name: 'Send to support' }).click();
    await expect(page.getByRole('alert')).toContainText('Claim not found');
    await expect(page.getByRole('heading', { name: 'Raise a grievance' })).toBeVisible();
    await expect(page.getByText('Your ticket')).toHaveCount(0);
  });
});

test.describe('Support: tickets cannot be reopened', () => {
  test('a ticket closed by support offers no reopen, only the phone route', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/member/helpline');
    // Open the closed-by-support seed ticket (TKT-10355 on ORD-23990) through its service bucket.
    await page.getByRole('button', { name: 'In-Clinic Consultation' }).click();
    await page.getByRole('button', { name: 'Ticket closed' }).first().click();
    await expect(page.getByText('TKT-10355', { exact: true })).toBeVisible();
    await expect(page.getByText('Resolved and closed by support on')).toBeVisible();
    await expect(page.getByRole('button', { name: /reopen/i })).toHaveCount(0);
    await expect(page.getByText(/reopen/i)).toHaveCount(0);
    await expect(page.getByText('Want to take it further?')).toBeVisible();
  });
});
