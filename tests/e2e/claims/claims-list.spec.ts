import { test, expect } from '@playwright/test';

test.describe('Claims list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/member/claims');
    await page.waitForLoadState('networkidle');
    // Wait for Angular OnPush change detection to settle
    await page.waitForTimeout(300);
    // Wait for dashboard loading state to clear
    await page.getByRole('status', { name: /Loading dashboard/i }).waitFor({ state: 'detached' });
  });

  test('dashboard summary cards are visible', async ({ page }) => {
    await page.waitForSelector('text=Total claims', { state: 'visible', timeout: 10000 });
    await expect(page.locator('text=Total claims')).toBeVisible();
    await expect(page.locator('text=In progress')).toBeVisible();
    await expect(page.locator('text=Claimed')).toBeVisible();
    await expect(page.locator('text=Approved')).toBeVisible();
  });

  test('each claim row links to its detail page', async ({ page }) => {
    const rows = page.locator('a[routerLink^="/member/claims/"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('status badges render on claim rows', async ({ page }) => {
    const badges = page.locator('opd-status-badge');
    expect(await badges.count()).toBeGreaterThan(0);
    await expect(badges.first()).toBeVisible();
  });

  test('loading indicator appears then clears', async ({ page }) => {
    // During initial load, a loading indicator should be present.
    const loading = page.locator('opd-loading[label="Loading claims"]');
    await expect(loading).toBeVisible();
    // It should disappear once data is loaded.
    await loading.waitFor({ state: 'detached' });
  });
});