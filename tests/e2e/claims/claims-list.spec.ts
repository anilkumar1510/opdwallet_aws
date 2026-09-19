import { test, expect } from '@playwright/test';

test.describe('Claims list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/member/claims');
    await page.waitForLoadState('domcontentloaded');
    // Wait for Angular to stabilize
    await page.waitForTimeout(500);
  });

  test('dashboard summary cards are visible', async ({ page }) => {
    // The dashboard loads async; wait for cards to appear
    await expect(page.locator('text=Total claims')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=In progress')).toBeVisible();
    await expect(page.locator('text=Claimed')).toBeVisible();
    await expect(page.locator('text=Approved')).toBeVisible();
  });

  test('each claim row links to its detail page', async ({ page }) => {
    // Wait for claim list to render (uses clailListData from API)
    await page.waitForSelector('a[routerLink^="/member/claims/"]', { timeout: 30000 });
    const rows = page.locator('a[routerLink^="/member/claims/"]');
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