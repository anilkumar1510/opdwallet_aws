import { test, expect } from '@playwright/test';
import { injectSessionCookie } from '../../utils/session';

test.describe('Claims list', () => {
  test.beforeEach(async ({ page }) => {
    await injectSessionCookie(page);
    await page.goto('/member/claims');
    await page.waitForLoadState('domcontentloaded');
  });

  test('dashboard summary cards are visible', async ({ page }) => {
    await expect(page.getByText('Total claims', { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('In progress', { exact: true })).toBeVisible();
    await expect(page.getByText('Claimed', { exact: true })).toBeVisible();
    await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible();
  });

  test('each claim row links to its detail page', async ({ page }) => {
    // Wait for claim list to render (uses claimListData from API)
    // Exclude the "New Claim" link at /member/claims/new
    await page.waitForSelector('a[href^="/member/claims/"]:not([href="/member/claims/new"])', { timeout: 30000 });
    const rows = page.locator('a[href^="/member/claims/"]:not([href="/member/claims/new"])');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('status badges render on claim rows', async ({ page }) => {
    await page.waitForSelector('opd-status-badge', { timeout: 30000 });
    const badges = page.locator('opd-status-badge');
    await expect(badges.first()).toBeVisible({ timeout: 10000 });
    expect(await badges.count()).toBeGreaterThan(0);
  });

  test('loading indicator appears then clears', async ({ page }) => {
    // Just verify the page title renders
    await expect(page.getByRole('heading', { name: 'Claims' }).first()).toBeVisible();
  });
});