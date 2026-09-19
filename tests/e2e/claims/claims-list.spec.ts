import { test, expect } from '@playwright/test';

test.describe('Claims list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/member/claims');
  });

  test('dashboard summary cards are visible', async ({ page }) => {
    await page.getByRole('status', { name: /Loading dashboard/i }).waitFor({ state: 'detached' });

    await expect(page.locator('text=Total claims')).toBeVisible();
    await expect(page.locator('text=In progress')).toBeVisible();
    await expect(page.locator('text=Claimed')).toBeVisible();
    await expect(page.locator('text=Approved')).toBeVisible();
  });

  test('each claim row links to its detail page', async ({ page }) => {
    await page.getByRole('status', { name: /Loading dashboard/i }).waitFor({ state: 'detached' });

    for (const ref of ['CLM-2026-0009', 'CLM-2026-0006', 'CLM-2026-0004', 'CLM-2026-0002']) {
      const row = page.locator(`a[routerLink="/member/claims/${ref}"]`);
      await expect(row).toHaveCount(1);
    }
  });

  test('status badges render on claim rows', async ({ page }) => {
    await page.getByRole('status', { name: /Loading dashboard/i }).waitFor({ state: 'detached' });

    const badges = page.locator('opd-status-badge');
    expect(await badges.count()).toBeGreaterThan(0);
    await expect(badges.first()).toBeVisible();
  });

  test('loading indicator appears then clears', async ({ page }) => {
    const loading = page.locator('opd-loading[label="Loading claims"]');
    await expect(loading).toBeVisible();
    await loading.waitFor({ state: 'detached' });
  });
});
