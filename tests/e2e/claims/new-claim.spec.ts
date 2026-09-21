import { test, expect } from '@playwright/test';

test.describe('New claim', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/member/claims/new');
    await page.getByRole('heading', { name: 'New Claim' }).waitFor();
  });

  test('step 1 validation blocks Continue with missing fields', async ({ page }) => {
    const continueBtn = page.getByRole('button', { name: 'Continue' });

    await expect(continueBtn).toBeDisabled();
    await expect(page.locator('text=Choose the treatment date')).toBeVisible();
    await expect(page.locator('text=Enter the bill amount')).toBeVisible();
  });

  test('navigates step 1 → 2 → 3 with valid data', async ({ page }) => {
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await page.locator('#treatmentDate').fill('2026-09-01');
    await page.locator('#billAmount').fill('100');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 test'),
    });
    await page.locator('#bankHolder').fill('Shivam Jha');
    await page.locator('#bankAccount').fill('123456789012');
    await page.locator('#bankIfsc').fill('HDFC0001234');
    await page.locator('#bankName').fill('HDFC Bank');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Review your claim' })).toBeVisible();
  });

  test('review summary reflects entered data', async ({ page }) => {
    await page.locator('#category').selectOption('VISION');
    await page.locator('#treatmentDate').fill('2026-09-15');
    await page.locator('#billAmount').fill('250');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.locator('#bankHolder').fill('Shivam Jha');
    await page.locator('#bankAccount').fill('123456789012');
    await page.locator('#bankIfsc').fill('HDFC0001234');
    await page.locator('#bankName').fill('HDFC Bank');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.locator('dd', { hasText: 'Vision' })).toBeVisible();
    await expect(page.locator('text=₹250.00').first()).toBeVisible();
  });

  test('over-limit bill shows cap notice on submit', async ({ page }) => {
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await page.locator('#billAmount').fill('600');
    await page.locator('#treatmentDate').fill('2026-09-01');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.locator('#bankHolder').fill('Shivam Jha');
    await page.locator('#bankAccount').fill('123456789012');
    await page.locator('#bankIfsc').fill('HDFC0001234');
    await page.locator('#bankName').fill('HDFC Bank');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Submit claim' }).click();

    await expect(page.locator('text=was capped to')).toBeVisible();
  });
});
