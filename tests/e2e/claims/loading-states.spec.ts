import { test, expect } from '@playwright/test';

test.describe('Loading states', () => {
  test('patient dropdown shows Loading… then settles', async ({ page }) => {
    await page.goto('/member/claims/new');
    await page.locator('#patient').waitFor({ state: 'attached' });
    await expect(page.getByLabel('Patient').locator('option', { hasText: 'Loading…' })).toBeVisible();

    await page.locator('#patient').waitFor({ state: 'visible' });
    await page.locator('#patient').locator('option:not([disabled])').first().waitFor({ state: 'visible' });
  });

  test('category dropdown is populated', async ({ page }) => {
    await page.goto('/member/claims/new');
    await page.getByRole('heading', { name: 'New Claim' }).waitFor();

    await page.locator('#category option').nth(1).waitFor({ state: 'attached' });
    await expect(page.locator('#category option', { hasText: 'Online Consultation' })).toBeAttached();
  });

  test('dashboard spinner on claims list', async ({ page }) => {
    await page.goto('/member/claims');
    await expect(page.getByRole('status', { name: /Loading dashboard/i })).toBeVisible();
    await page.getByRole('status', { name: /Loading dashboard/i }).waitFor({ state: 'detached' });
  });

  test('all dropdowns settle before interaction', async ({ page }) => {
    await page.goto('/member/claims/new');
    await page.getByRole('heading', { name: 'New Claim' }).waitFor();

    await page.locator('#patient option').nth(1).waitFor({ state: 'attached' });
    await page.locator('#category option').nth(1).waitFor({ state: 'attached' });

    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await expect(page.locator('#category')).toHaveValue('ONLINE_CONSULTATION');
  });
});
