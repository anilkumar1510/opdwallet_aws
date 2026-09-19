import { test, expect } from '@playwright/test';

test.describe('Claim detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/member/claims');
    await page.getByRole('status', { name: /Loading dashboard/i }).waitFor({ state: 'detached' });
  });

  for (const ref of ['CLM-2026-0009', 'CLM-2026-0006', 'CLM-2026-0004', 'CLM-2026-0002']) {
    test(`opens ${ref} and shows details`, async ({ page }) => {
      await page.goto(`/member/claims/${ref}`);
      await page.getByRole('heading', { name: 'Claim Details' }).waitFor();
      await expect(page.locator(`text=${ref}`).first()).toBeVisible();
    });
  }

  test('scenario switcher changes status display', async ({ page }) => {
    await page.goto('/member/claims/CLM-2026-0009');
    await page.getByRole('heading', { name: 'Claim Details' }).waitFor();

    const select = page.locator('select');
    await select.selectOption('approved');

    await expect(page.locator('p', { hasText: 'Approved (full)' })).toBeVisible();
  });

  test('cancel flow withdraws a cancellable claim', async ({ page }) => {
    await page.goto('/member/claims/CLM-2026-0009');
    await page.getByRole('heading', { name: 'Claim Details' }).waitFor();

    await page.getByRole('button', { name: 'Cancel this claim' }).click();
    await page.getByRole('button', { name: 'Yes, withdraw it' }).click();

    await page.waitForURL('**/member/claims**');
    await expect(page.getByRole('heading', { name: /Claims/ })).toBeVisible();
  });
});
