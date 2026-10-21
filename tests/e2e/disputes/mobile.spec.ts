import { devices, expect, Page, test } from '@playwright/test';
import type { Browser } from '@playwright/test';

import { FakeApi, claimRowOf, claimsSection, openSupport, raise } from './fake-api';

/**
 * The grievance screens on phone-sized viewports (emulated iPhone 13 and Pixel 7):
 * nothing may push the page sideways, long words and long file names must wrap
 * or truncate, and the main actions must be tappable. Fake API, so no session
 * is needed. Real devices are a manual check.
 */
const PHONES = [
  ['iPhone 13', devices['iPhone 13']],
  ['Pixel 7', devices['Pixel 7']],
] as const;

const LONG_WORD = 'https://example.test/' + 'a'.repeat(160);
const LONG_FILE = 'a-very-long-document-file-name-' + 'x'.repeat(90) + '.pdf';

async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page is wider than the screen').toBeLessThanOrEqual(1);
}

async function expectTappable(page: Page, name: string | RegExp): Promise<void> {
  const box = await page.getByRole('button', { name }).first().boundingBox();
  expect(box, `${name} is on screen`).not.toBeNull();
  expect(box!.height, `${name} is tall enough to tap`).toBeGreaterThanOrEqual(36);
  expect(box!.x + box!.width, `${name} fits the screen`).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
}

// test.use({ headless: true });

/** One test on an emulated phone (a fresh context per test, as device settings cannot change inside a describe). */
function onPhone(label: string, device: (typeof PHONES)[number][1], name: string, run: (page: Page) => Promise<void>): void {
  test(`${label}: ${name}`, async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    try {
      await run(page);
    } finally {
      await context.close();
    }
  });
}

for (const [label, device] of PHONES) {
  const test = (name: string, run: (args: { page: Page }) => Promise<void>) => onPhone(label, device, name, (page) => run({ page }));
  {

    test('home: claims list and Load more fit the screen', async ({ page }) => {
      await openSupport(page);
      await expectNoSidewaysScroll(page);
      await expectTappable(page, 'Load more');
      await claimsSection(page).getByRole('button', { name: 'Load more' }).click();
      await expectNoSidewaysScroll(page);
    });

    test('order detail and the raise form, with a long file name', async ({ page }) => {
      await openSupport(page);
      await claimsSection(page).getByText('OPD-2026-00354').click();
      await expectNoSidewaysScroll(page);
      await expectTappable(page, 'Raise a grievance');
      await page.getByRole('button', { name: 'Raise a grievance' }).click();
      await page.selectOption('#g-reason', 'Issue with documents requested'.length ? 'Other' : '');
      await page.fill('#g-detail', LONG_WORD);
      await page.setInputFiles('#g-docs', { name: LONG_FILE, mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
      await expect(page.getByText(/ · uploaded/)).toBeVisible();
      await expectNoSidewaysScroll(page);
      await expectTappable(page, 'Send to support');
    });

    test('ticket thread: a long unbroken word, a long file name and the reply box stay on screen', async ({ page }) => {
      const api = new FakeApi();
      api.seed(
        { claim_id: 'OPD-2026-00354', dispute_status: 'Awaiting user response', documents: [{ name: LONG_FILE, document_id: 'doc-1', originalname: LONG_FILE }] },
        [
          { sender_type: 'MEMBER', message_text: LONG_WORD },
          { sender_type: 'SUPPORT_EXECUTIVE', message_text: LONG_WORD },
        ],
      );
      await openSupport(page, api);
      await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Response received' }).click();
      await expect(page.getByText('Documents you attached')).toBeVisible({ timeout: 20000 });
      await expectNoSidewaysScroll(page);
      await page.fill('#g-reply', LONG_WORD);
      await expectNoSidewaysScroll(page);
      await expectTappable(page, 'Send reply');
      await expectTappable(page, 'Download');
    });

    test('a closed ticket with a long resolution fits the screen', async ({ page }) => {
      const api = new FakeApi();
      api.seed({ claim_id: 'OPD-2026-00354', dispute_status: 'Resolved', final_reason: LONG_WORD }, [{ sender_type: 'MEMBER', message_text: 'hi' }]);
      await openSupport(page, api);
      await claimRowOf(page, 'OPD-2026-00354').getByRole('button', { name: 'Ticket closed' }).click();
      await expect(page.getByText('Want to take it further?')).toBeVisible({ timeout: 20000 });
      await expectNoSidewaysScroll(page);
    });

    test('submit end to end on a phone', async ({ page }) => {
      const api = await openSupport(page);
      await raise(page, 'Claim rejected incorrectly');
      await expect(page.getByText('Your ticket')).toBeVisible({ timeout: 20000 });
      await expectNoSidewaysScroll(page);
      expect(api.submits).toHaveLength(1);
    });

    test('something else: the call and email buttons fit the screen', async ({ page }) => {
      await openSupport(page);
      await expect(page.getByRole('link', { name: /1800-000-0000/ })).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  }
}
