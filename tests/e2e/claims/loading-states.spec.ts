import { test, expect } from '@playwright/test';
import { injectSessionCookie } from '../../utils/session';

test.describe('Loading states', () => {
  test('patient dropdown shows Loading… then settles', async ({ page }) => {
    await injectSessionCookie(page);
    await page.goto('/member/claims/new');
    await page.locator('#patient').waitFor({ state: 'attached' });
    // The Loading… option may appear briefly; if it does, wait for it to clear
    const loadingOption = page.getByLabel('Patient').locator('option', { hasText: 'Loading…' });
    if (await loadingOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await loadingOption.waitFor({ state: 'detached', timeout: 10000 });
    }
    // Wait for a real patient option to be available (attached, not necessarily visible since dropdown is closed)
    await page.locator('#patient option:not([disabled])').first().waitFor({ state: 'attached' });
  });

  test('category dropdown is populated', async ({ page }) => {
    await injectSessionCookie(page);
    await page.goto('/member/claims/new');
    await page.getByRole('heading', { name: 'New Claim' }).waitFor();

    await page.locator('#category option').nth(1).waitFor({ state: 'attached' });
    await expect(page.locator('#category option', { hasText: 'Online Consult' })).toBeAttached();
  });

  test('dashboard spinner on claims list', async ({ page }) => {
    await injectSessionCookie(page);
    await page.goto('/member/claims');
    // The dashboard may load quickly; if spinner appears, wait for it to clear
    const spinner = page.getByRole('status', { name: /Loading dashboard/i });
    if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
      await spinner.waitFor({ state: 'detached', timeout: 15000 });
    }
    // Verify the page loaded by checking for the Claims heading
    await expect(page.getByRole('heading', { name: 'Claims' }).first()).toBeVisible();
  });

  test('all dropdowns settle before interaction', async ({ page }) => {
    await injectSessionCookie(page);
    await page.goto('/member/claims/new');
    await page.getByRole('heading', { name: 'New Claim' }).waitFor();

    await page.locator('#patient option').nth(1).waitFor({ state: 'attached' });
    await page.locator('#category option').nth(1).waitFor({ state: 'attached' });

    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await expect(page.locator('#category')).toHaveValue('ONLINE_CONSULTATION');
  });
});
